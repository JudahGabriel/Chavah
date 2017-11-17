using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class SongsController : RavenController
    {        
        public SongsController(IAsyncDocumentSession dbSession, ILogger<SongsController> logger)
            : base(dbSession, logger)
        {
        }

        [HttpGet]
        public async Task<IEnumerable<Song>> GetRecentPlays(int count)
        {
            var user = await this.GetCurrentUser();
            if (user == null)
            {
                return new Song[0];
            }

            var songs = await DbSession.LoadAsync<Song>(user.RecentSongIds.Take(count * 2));
            return songs
                .Where(s => s != null)
                .Distinct(s => s.Id)
                .Take(count)
                .ToList();
        }

        [HttpGet]
        public async Task<IEnumerable<Song>> GetRandomLikedSongs(int count)
        {
            var user = await this.GetCurrentUser();
            if (user == null)
            {
                return new Song[0];
            }

            var likedSongIds = await this.DbSession
                .Query<Like>()
                .Customize(x => x.RandomOrdering())
                .Customize(x => x.Include<Like>(l => l.SongId))
                .Where(l => l.Status == LikeStatus.Like && l.UserId == user.Id)
                .Select(l => l.SongId)
                .Take(count)
                .ToListAsync();

            var loadedSongs = await this.DbSession.LoadAsync<Song>(likedSongIds);
            return loadedSongs
                .Where(s => s != null)
                .Select(s => s.ToDto());
        }

        [HttpGet]
        public async Task<PagedList<Song>> GetLikedSongs(int skip, int take)
        {
            var user = await this.GetCurrentUser();
            if (user == null)
            {
                return new PagedList<Song>();
            }
            
            var likedSongIds = await this.DbSession
                .Query<Like>()
                .Customize(x => x.Include<Like>(l => l.SongId))
                .Statistics(out var stats)
                .Where(l => l.Status == LikeStatus.Like && l.UserId == user.Id)
                .OrderByDescending(l => l.Date)
                .Select(l => l.SongId)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            var songs = await this.DbSession.LoadAsync<Song>(likedSongIds);
            return new PagedList<Song>
            {
                Items = songs.Where(s => s != null).ToArray(),
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        [HttpGet]
        public async Task<IEnumerable<Song>> Search(string searchText)
        {
            var makeQuery = new Func<Func<string, IQueryable<Song>>>(() =>
            {
                return q => this.DbSession
                    .Query<Song, Songs_Search>()
                    .Search(s => s.Name, q, 2, SearchOptions.Guess, EscapeQueryOptions.AllowPostfixWildcard)
                    .Search(s => s.Album, q, 1, SearchOptions.Guess, EscapeQueryOptions.AllowPostfixWildcard)
                    .Search(s => s.Artist, q, 1, SearchOptions.Guess, EscapeQueryOptions.AllowPostfixWildcard)
                    .Take(50);
            });

            var query = makeQuery()(searchText + "*");
            var results = await query.ToListAsync();
            
            // No results? See if we can suggest some near matches.
            if (results.Count == 0)
            {
                var suggestResults = await makeQuery()(searchText + "*").SuggestAsync();
                var suggestions = suggestResults.Suggestions;
                var firstSuggestion = suggestions.FirstOrDefault();
                if (firstSuggestion != null)
                {
                    // Run the query for that suggestion.
                    var newQuery = makeQuery();
                    var suggestedResults = await newQuery(firstSuggestion).ToListAsync();
                    return suggestedResults.Select(r => r.ToDto());
                }
            }

            return results.Select(r => r.ToDto());
        }

        /// <summary>
        /// Used for debugging: generates a user's song preferences table as a list of strings. Includes performance measurements.
        /// </summary>
        /// <param name="email"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<List<string>> GetPrefsDebug(string email)
        {
            var stopWatch = new System.Diagnostics.Stopwatch();
            stopWatch.Start();

            var userId = "ApplicationUsers/" + email;
            var userPreferences = await DbSession.Query<Like, Likes_SongPreferences>()
                .As<UserSongPreferences>()
                .FirstOrDefaultAsync(u => u.UserId == userId);

            var userPrefsTime = stopWatch.Elapsed;
            stopWatch.Restart();

            if (userPreferences == null)
            {
                userPreferences = new UserSongPreferences();
            }

            var songsWithRanking = await this.DbSession.Query<Song, Songs_RankStandings>()
                    .As<Songs_RankStandings.Result>()
                    .ToListAsync();
            var rankingTime = stopWatch.Elapsed;
            stopWatch.Restart();

            var table = userPreferences.BuildSongWeightsTable(songsWithRanking);

            var tableTime = stopWatch.Elapsed;
            stopWatch.Stop();

            var songsOrderedByWeight = table
                .Select(s => (SongId: s.Key, Weight: s.Value.Weight, ArtistMultiplier: s.Value.ArtistMultiplier, AlbumMultiplier: s.Value.AlbumMultiplier, SongMultipler: s.Value.SongMultiplier, TagMultiplier: s.Value.TagMultiplier, RankMultiplier: s.Value.CommunityRankMultiplier))
                .OrderByDescending(s => s.Weight)
                .Select(s => $"Song ID {s.SongId}, Weight {s.Weight}, Artist multiplier: {s.ArtistMultiplier}, Album multipler: {s.AlbumMultiplier}, Song multiplier: {s.SongMultipler}, Tag multiplier {s.TagMultiplier}, Rank multiplier: {s.RankMultiplier}")
                .ToList();

            songsOrderedByWeight.Insert(0, $"Performance statistics: Total query time {tableTime + rankingTime + userPrefsTime}. Querying user prefs {userPrefsTime}, querying ranking {rankingTime}, building table {tableTime}");

            return songsOrderedByWeight;
        }

        /// <summary>
        /// Called when the user asks for the next song.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<Song> ChooseSong()
        {
            // HOT PATH: This method greatly impacts the UI. The user waits for this method before ever hearing a song.
            // We want to send back the next song ASAP.

            var userPreferences = default(UserSongPreferences);
            var songsWithRanking = default(IList<Songs_RankStandings.Result>);

            // Aggressive caching for the UserSongPreferences and SongsWithRanking. These don't change often.
            using (DbSession.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(1)))
            {
                var user = await this.GetCurrentUser();

                // This is NOT an unbounded result set:
                // This queries the Songs_RankStandings index, which will reduce the results. Max number of results will be the number of CommunityRankStanding enum constants.
                songsWithRanking = await this.DbSession.Query<Song, Songs_RankStandings>()
                    .As<Songs_RankStandings.Result>()
                    .ToListAsync();
                if (user != null)
                {
                    userPreferences = await DbSession.Query<Like, Likes_SongPreferences>()
                        .As<UserSongPreferences>()
                        .FirstOrDefaultAsync(u => u.UserId == user.Id);
                }
                if (userPreferences == null)
                {
                    userPreferences = new UserSongPreferences();
                }
            }

            // Run the song picking algorithm.
            var songPick = userPreferences.PickSong(songsWithRanking);
            if (string.IsNullOrEmpty(songPick.SongId))
            {
                logger.LogWarning("Chose song but ended up with an empty Song ID.", songPick);
                return await this.PickRandomSong();
            }

            var song = await DbSession.LoadNotNullAsync<Song>(songPick.SongId);            
            var songLikeDislike = userPreferences.Songs.FirstOrDefault(s => s.SongId == song.Id);
            var songLikeStatus = songLikeDislike != null && songLikeDislike.LikeCount > 0 ?
                LikeStatus.Like : songLikeDislike != null && songLikeDislike.DislikeCount > 0 ?
                LikeStatus.Dislike : LikeStatus.None;
            return song.ToDto(songLikeStatus, songPick);
        }
        
        [HttpGet]
        public async Task<IEnumerable<Song>> ChooseSongBatch()
        {
            const int songsInBatch = 5;
            var userPreferences = default(UserSongPreferences);
            var songsWithRanking = default(IList<Songs_RankStandings.Result>);

            // Aggressive caching for the UserSongPreferences and SongsWithRanking. These don't change often.
            using (var cache = DbSession.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(1)))
            {
                var user = await this.GetCurrentUser();

                // This is NOT an unbounded result set:
                // This queries the Songs_RankStandings index, which will reduce the results. Max number of results will be the number of CommunityRankStanding enum constants.
                songsWithRanking = await this.DbSession.Query<Song, Songs_RankStandings>()
                    .As<Songs_RankStandings.Result>()
                    .ToListAsync();
                if (user != null)
                {
                    userPreferences = await DbSession.Query<Like, Likes_SongPreferences>()
                        .As<UserSongPreferences>()
                        .FirstOrDefaultAsync(u => u.UserId == user.Id);
                }
                if (userPreferences == null)
                {
                    userPreferences = new UserSongPreferences();
                }
            }

            // Run the song picking algorithm.
            var batch = new List<Song>(songsInBatch);
            var pickedSongs = Enumerable.Range(0, 5)
                .Select(_ => userPreferences.PickSong(songsWithRanking))
                .ToList();
            if (pickedSongs.Any(s => string.IsNullOrEmpty(s.SongId)))
            {
                logger.LogWarning("Picked songs for batch, but returned one or more empty song IDs", pickedSongs);
            }

            // Make a single trip to the database to load all the picked songs.
            var pickedSongIds = pickedSongs
                .Select(s => s.SongId)
                .ToList();
            var songs = await DbSession.LoadAsync<Song>(pickedSongIds);
            if (songs.Any(s => s == null))
            {
                logger.LogWarning("Picked songs for batch, but some of the songs came back null.", (SongPicks: pickedSongs, SongIds: pickedSongIds));
            }

            var songDtos = new List<Song>(songs.Length);
            for (var i = 0; i < songs.Length; i++)
            {
                var song = songs[i];
                if (song != null)
                {
                    var pickReasons = pickedSongs[i];
                    var songLikeDislike = userPreferences.Songs.FirstOrDefault(s => s.SongId == song.Id);
                    var songLikeStatus = songLikeDislike != null && songLikeDislike.LikeCount > 0 ?
                        LikeStatus.Like : songLikeDislike != null && songLikeDislike.DislikeCount > 0 ?
                        LikeStatus.Dislike : LikeStatus.None;
                    var dto = song.ToDto(songLikeStatus, pickReasons);
                    songDtos.Add(dto);
                }
            }

            return songDtos;
        }
        
        [HttpGet]
        public async Task<Song> GetSongById(string songId)
        {
            var song = await this.DbSession.LoadAsync<Song>(songId);
            if (song == null)
            {
                return null;
            }

            return await this.GetSongDto(song, SongPick.YouRequestedSong);
        }

        [HttpPost]
        public async Task SongCompleted(string songId)
        {
            var user = await this.GetCurrentUser();
            if (user != null)
            {
                user.TotalPlays++;
                user.LastSeen = DateTime.UtcNow;
                user.AddRecentSong(songId);
            }

            var song = await this.DbSession.LoadAsync<Song>(songId);
            if (song != null)
            {
                song.TotalPlays++;
            }
        }
        
        [HttpGet]
        public async Task<Song> GetByArtistAndAlbum(string artist, string album)
        {
            var songOrNull = await this.DbSession.Query<Song, Songs_GeneralQuery>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.Album == album && s.Artist == artist);
            if (songOrNull == null)
            {
                logger.LogWarning("Couldn't find song by artist and album", (Artist: artist, Album: album));
                return null;
            }

            return await this.GetSongDto(songOrNull, SongPick.SongFromAlbumRequested);
        }

        [HttpGet]
        public async Task<Song> GetByTag(string tag)
        {
            var songOrNull = await this.DbSession.Query<Song, Songs_GeneralQuery>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.Tags.Contains(tag));
            if (songOrNull == null)
            {
                logger.LogWarning("Couldn't find song with tag", tag);
                return null;
            }
            
            return await this.GetSongDto(songOrNull, SongPick.SongWithTagRequested);
        }

        [HttpGet]
        public async Task<Song> GetByAlbum(string album)
        {
            var albumUnescaped = Uri.UnescapeDataString(album);
            var songOrNull = await this.DbSession.Query<Song, Songs_GeneralQuery>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.Album == albumUnescaped);
            if (songOrNull != null)
            {
                return await GetSongDto(songOrNull, SongPick.SongFromAlbumRequested);
            }

            return null;
        }
        
        [HttpGet]
        public async Task<Song> GetByArtist(string artist)
        {
            var artistUnescaped = Uri.UnescapeDataString(artist);
            var songOrNull = await this.DbSession.Query<Song, Songs_GeneralQuery>()
                .Customize(c => c.RandomOrdering())
                .FirstOrDefaultAsync(s => s.Artist == artistUnescaped);

            if (songOrNull != null)
            {
                return await GetSongDto(songOrNull, SongPick.SongFromArtistRequested);
            }

            return null;
        }

        [HttpGet]
        public async Task<PagedList<Song>> GetTrending(int skip, int take)
        {
            var recentLikedSongIds = await this.DbSession
                .Query<Like>()
                .Statistics(out var stats)
                .Customize(x => x.Include<Like>(l => l.SongId))
                .Where(l => l.Status == LikeStatus.Like)
                .OrderByDescending(l => l.Date)
                .Select(l => l.SongId)
                .Skip(skip)
                .Take(take + 10)
                .ToListAsync();
            var distinctSongIds = recentLikedSongIds
                .Distinct()
                .Take(take);

            var matchingSongs = await this.DbSession.LoadWithoutNulls<Song>(distinctSongIds);
            return new PagedList<Song>
            {
                Items = matchingSongs
                    .Select(s => s.ToDto())
                    .ToList(),
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }
        
        [HttpGet]
        public async Task<IEnumerable<Song>> GetPopular(int count)
        {
            var randomSpotInTop70 = new Random().Next(0, 70);
            var songs = await this.DbSession.Query<Song, Songs_GeneralQuery>()
                .Customize(x => x.RandomOrdering())
                .OrderByDescending(s => s.CommunityRank)
                .Skip(randomSpotInTop70)
                .Take(count)
                .ToListAsync();

            return songs.Select(s => s.ToDto(LikeStatus.None, SongPick.RandomSong));
        }

        [HttpGet]
        [Route("heavenly70")]
        public async Task<IEnumerable<Song>> GetHeavenly70()
        {
            return await this.DbSession.Query<Song, Songs_GeneralQuery>()
                .OrderByDescending(s => s.CommunityRank)
                .Take(70)
                .ToListAsync();
        }
                
        private async Task<Song> PickRandomSong()
        {
            return await this.DbSession.Query<Song, Songs_GeneralQuery>()
                .Customize(c => c.RandomOrdering())
                .FirstAsync();
        }

        private async Task<Song> GetSongDto(Song song, SongPick pickReason)
        {
            var user = await this.GetCurrentUser();
            if (user != null)
            {
                var songLike = await this.DbSession
                    .Query<Like>()
                    .FirstOrDefaultAsync(s => s.UserId == user.Id && s.SongId == song.Id);

                return song.ToDto(songLike.StatusOrNone(), pickReason);
            }

            return song.ToDto();
        }
    }
}