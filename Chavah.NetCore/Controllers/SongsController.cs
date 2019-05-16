using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Optional.Collections;

using Raven.Client.Documents;
using Raven.Client.Documents.Linq;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class SongsController : RavenController
    {
        private readonly ICdnManagerService _cdnManager;

        public SongsController(
            IAsyncDocumentSession dbSession,
            ILogger<SongsController> logger,
            ICdnManagerService cdnManager)
            : base(dbSession, logger)
        {
            _cdnManager = cdnManager;
        }

        [HttpGet]
        public async Task<List<Song>> GetRecentPlays(int count)
        {
            var user = await GetUser();
            if (user == null)
            {
                return new List<Song>(0);
            }

            var recentSongIds = user.RecentSongIds
                .Distinct()
                .Take(count);
            return await DbSession.LoadWithoutNulls<Song>(recentSongIds);
        }

        [HttpGet]
        public async Task<IEnumerable<Song>> GetRandomLikedSongs(int count)
        {
            var user = await GetUser();
            if (user == null)
            {
                return new Song[0];
            }

            var likedSongIds = await DbSession
                .Query<Like>()
                .Include(l => l.SongId)
                .Customize(x => x.RandomOrdering())
                .Where(l => l.Status == LikeStatus.Like && l.UserId == user.Id)
                .Select(l => l.SongId)
                .Take(count)
                .ToListAsync();

            var loadedSongs = await DbSession.LoadWithoutNulls<Song>(likedSongIds);
            return loadedSongs
                .Select(s => s.ToDto(LikeStatus.Like, SongPick.LikedSong));
        }

        [HttpGet]
        public async Task<PagedList<Song>> GetLikedSongs(
            int skip,
            int take,
            string search = null)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return new PagedList<Song>
                {
                    Items = new List<Song>(0),
                    Skip = skip,
                    Take = take,
                    Total = 0
                };
            }

            var query = DbSession.Query<Like, Likes_SongSearch>()
                .Where(l => l.UserId == userId)
                .ProjectInto<Likes_SongSearch.Result>();

            // If we're doing  a search;
            if (!string.IsNullOrEmpty(search))
            {
                query = query
                    .Search(s => s.Name, search + "*")
                    .Search(s => s.HebrewName, search + "*")
                    .Search(s => s.Album, search + "*")
                    .Search(s => s.Artist, search + "*");
            }

            var likes = await query
                .Include(l => l.SongId) // We want to load the songs
                .Statistics(out var stats) // Stats so that we can find total number of matches.
                .OrderByDescending(l => l.Date) // Most recent likes first
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            // The songs were already loaded into the session via the previous .Include call.
            var songs = await DbSession.LoadWithoutNulls<Song>(likes.Select(l => l.SongId));
            return new PagedList<Song>
            {
                Items = songs,
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        [HttpGet]
        public async Task<IEnumerable<Song>> Search(string searchText)
        {
            // Run the query that the user typed in.
            var results = await DbSession
                    .Query<Song, Songs_Search>()
                    .Search(s => s.Name, searchText)
                    .Search(s => s.HebrewName, searchText)
                    .Search(s => s.Album, searchText)
                    .Search(s => s.Artist, searchText)
                    .Take(10)
                    .ToListAsync();

            // No results? See if we can suggest some near matches.
            if (results.Count == 0)
            {
                // If any suggestions are found, the query is run against the first suggestion.
                var nameResults = await QuerySongSearchSuggestions(s => s.Name, searchText);
                var hebrewNameResults = await QuerySongSearchSuggestions(s => s.HebrewName, searchText);
                var artistResults = await QuerySongSearchSuggestions(s => s.Artist, searchText);
                var albumResults = await QuerySongSearchSuggestions(s => s.Album, searchText);

                // Combine all the suggestions.
                return nameResults.Take(3)
                    .Concat(hebrewNameResults.Take(3))
                    .Concat(artistResults.Take(3))
                    .Concat(albumResults.Take(3))
                    .Select(s => s.ToDto());
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

            var userId = "AppUsers/" + email;
            var userPreferences = await DbSession.Query<Like, Likes_SongPreferences>()
                .As<UserSongPreferences>()
                .FirstOrDefaultAsync(u => u.UserId == userId);

            var userPrefsTime = stopWatch.Elapsed;
            stopWatch.Restart();

            if (userPreferences == null)
            {
                userPreferences = new UserSongPreferences();
            }

            var songsWithRanking = await DbSession.Query<Song, Songs_RankStandings>()
                    .As<Songs_RankStandings.Result>()
                    .ToListAsync();
            var rankingTime = stopWatch.Elapsed;
            stopWatch.Restart();

            var table = userPreferences.BuildSongWeightsTable(songsWithRanking);

            var tableTime = stopWatch.Elapsed;
            stopWatch.Stop();

            var songsOrderedByWeight = table
                .Select(s => (SongId: s.Key, s.Value.Weight, s.Value.ArtistMultiplier, s.Value.AlbumMultiplier, SongMultipler: s.Value.SongMultiplier, s.Value.TagMultiplier, RankMultiplier: s.Value.CommunityRankMultiplier))
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
                var user = await GetUser();

                // This is NOT an unbounded result set:
                // This queries the Songs_RankStandings index, which will reduce the results. Max number of results will be the number of CommunityRankStanding enum constants.
                songsWithRanking = await DbSession.Query<Song, Songs_RankStandings>()
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
                return await PickRandomSong();
            }

            var song = await DbSession.LoadRequiredAsync<Song>(songPick.SongId);
            var songLikeDislike = userPreferences.Songs.FirstOrDefault(s => s.SongId == song.Id);
            var songLikeStatus = songLikeDislike?.LikeCount > 0 ?
                LikeStatus.Like : songLikeDislike?.DislikeCount > 0 ?
                LikeStatus.Dislike : LikeStatus.None;

            return song.ToDto(songLikeStatus, songPick);
        }

        [HttpGet]
        public async Task<List<Song>> ChooseSongBatch()
        {
            const int songsInBatch = 5;
            var userPreferences = default(UserSongPreferences);
            var songsWithRanking = default(IList<Songs_RankStandings.Result>);

            // Aggressive caching for the UserSongPreferences and SongsWithRanking. These don't change often.
            using (var cache = DbSession.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(1)))
            {
                var user = await GetUser();

                // This is NOT an unbounded result set:
                // This queries the Songs_RankStandings index, which will reduce the results. Max number of results will be the number of CommunityRankStanding enum constants.
                songsWithRanking = await DbSession.Query<Song, Songs_RankStandings>()
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
            var pickedSongs = Enumerable.Range(0, songsInBatch)
                .Select(_ => userPreferences.PickSong(songsWithRanking))
                .ToList();

            if (pickedSongs.Any(s => string.IsNullOrEmpty(s.SongId)))
            {
                logger.LogWarning("Picked songs for batch, but returned one or more empty song IDs {pickedSongs}", pickedSongs);
            }

            // Make a single trip to the database to load all the picked songs.
            var pickedSongIds = pickedSongs
                .Select(s => s.SongId)
                .ToList();
            var songs = await DbSession
                .LoadWithoutNulls<Song>(pickedSongIds);
            var songDtos = new List<Song>(songs.Count);
            for (var i = 0; i < songs.Count; i++)
            {
                var song = songs[i];
                if (song != null)
                {
                    var pickReasons = pickedSongs[i];
                    var songLikeDislike = userPreferences.Songs.FirstOrDefault(s => s.SongId == song.Id);
                    var songLikeStatus = songLikeDislike?.LikeCount > 0 ?
                        LikeStatus.Like : songLikeDislike?.DislikeCount > 0 ?
                        LikeStatus.Dislike : LikeStatus.None;
                    var dto = song.ToDto(songLikeStatus, pickReasons);
                    songDtos.Add(dto);
                }
            }

            return songDtos;
        }

        [HttpGet]
        public async Task<Song> GetById(string songId)
        {
            var song = await DbSession.LoadAsync<Song>(songId);
            if (song == null)
            {
                return null;
            }

            var songDto = await GetSongDto(song, SongPick.YouRequestedSong);
            return songDto;
        }

        [HttpPost]
        public async Task SongCompleted(string songId)
        {
            var user = await GetUser();
            if (user != null)
            {
                user.TotalPlays++;
                user.LastSeen = DateTime.UtcNow;
                user.AddRecentSong(songId);
            }

            var song = await DbSession.LoadAsync<Song>(songId);
            if (song != null)
            {
                song.TotalPlays++;
            }
        }

        [HttpGet]
        public async Task<Song> GetByArtistAndAlbum(string artist, string album)
        {
            var songOrNull = await DbSession.Query<Song, Songs_GeneralQuery>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.Album == album && s.Artist == artist);
            if (songOrNull == null)
            {
                logger.LogWarning("Couldn't find song by artist and album", (Artist: artist, Album: album));
                return null;
            }

            return await GetSongDto(songOrNull, SongPick.SongFromAlbumRequested);
        }

        [HttpGet]
        public async Task<Song> GetByTag(string tag)
        {
            var songOrNull = await DbSession.Query<Song, Songs_GeneralQuery>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.Tags.Contains(tag));
            if (songOrNull == null)
            {
                logger.LogWarning("Couldn't find song with tag", tag);
                return null;
            }

            return await GetSongDto(songOrNull, SongPick.SongWithTagRequested);
        }

        [HttpGet]
        public async Task<Song> GetByAlbum(string album)
        {
            var albumUnescaped = Uri.UnescapeDataString(album);
            var songOrNull = await DbSession.Query<Song, Songs_GeneralQuery>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.Album == albumUnescaped);
            if (songOrNull != null)
            {
                return await GetSongDto(songOrNull, SongPick.SongFromAlbumRequested);
            }

            return null;
        }

        [HttpGet]
        public async Task<Song> GetByAlbumId(string albumId)
        {
            var songOrNull = await DbSession.Query<Song, Songs_GeneralQuery>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.AlbumId == albumId);
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
            var songOrNull = await DbSession.Query<Song, Songs_GeneralQuery>()
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
            var trendingLikes = await DbSession.Query<Like, Likes_SongSearch>()
                .Statistics(out var stats)
                .Include(l => l.SongId) // Load the song with it.
                .OrderByDescending(l => l.Date)
                .ProjectInto<Likes_SongSearch.Result>()
                .Take(take + 10) // So that we can weed out duplicates
                .ToListAsync();

            // Not a remote call; songs were already loaded into memory via .Include above.
            var distinctSongIds = trendingLikes
                .Select(l => l.SongId)
                .Distinct()
                .Take(take);
            var songs = await DbSession.LoadWithoutNulls<Song>(distinctSongIds);
            return new PagedList<Song>
            {
                Items = songs
                    .Select(s => s.ToDto())
                    .ToList(),
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        [HttpGet]
        public async Task<List<Song>> GetPopular(int count)
        {
            var randomSpotInTop70 = new Random().Next(0, 70);
            var songs = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Customize(x => x.RandomOrdering())
                .OrderByDescending(s => s.CommunityRank)
                .Skip(randomSpotInTop70)
                .Take(count)
                .ToListAsync();
            return songs
                .Select(s => s.ToDto())
                .ToList();
        }

        [HttpGet]
        public async Task<IEnumerable<Song>> Heavenly70()
        {
            return await DbSession.Query<Song, Songs_GeneralQuery>()
                .OrderByDescending(s => s.CommunityRank)
                .Take(70)
                .ToListAsync();
        }

        /// <summary>
        /// Gets a paged list of all songs for display in the admin UI.
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="take"></param>
        /// <param name="search"></param>
        /// <returns></returns>
        [HttpGet]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<PagedList<Song>> GetSongsAdmin(
            int skip,
            int take,
            string search)
        {
            QueryStatistics stats;
            List<Song> songs;
            var hasSearch = !string.IsNullOrWhiteSpace(search);
            if (hasSearch)
            {
                songs = await DbSession.Query<Song, Songs_Search>()
                    .Statistics(out stats)
                    .Search(x => x.Name, search)
                    .Search(x => x.Artist, search)
                    .Search(x => x.Album, search)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();
            }
            else
            {
                songs = await DbSession.Query<Song>()
                    .Statistics(out stats)
                    .OrderByDescending(s => s.UploadDate)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();
            }

            return new PagedList<Song>
            {
                Items = songs,
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task DeleteSong([FromBody]Song song)
        {
            var existingSong = await DbSession
                .Include<Song>(s => s.AlbumId)
                .LoadRequiredAsync<Song>(song.Id);
            DbSession.Delete(existingSong);

            // Delete all likes of this song.
            var operation = await DbSession.Advanced.DocumentStore
                .Operations
                .SendAsync(new Raven.Client.Documents.Operations.PatchByQueryOperation(
                    @"from Likes as like
                      where like.SongId = '" + existingSong.Id + @"'
                      update
                      {
                          var likeId = id(this);
                          del(likeId);
                      }"));

            // Update the album's song count.
            if (!string.IsNullOrEmpty(existingSong.AlbumId))
            {
                var album = await DbSession.LoadAsync<Album>(existingSong.AlbumId);
                if (album != null)
                {
                    album.SongCount--;

                    // No more songs on the album? Delete it.
                    if (album.SongCount == 0)
                    {
                        DbSession.Delete(album);
                    }
                }
            }

            try
            {
                await _cdnManager.DeleteSongAsync(existingSong);
            }
            catch (Exception deleteFromCdnError)
            {
                logger.LogWarning(deleteFromCdnError, "Deleted song {songId}, but was unable to remove from CDN.", song.Id);
            }
        }

        private async Task<Song> PickRandomSong()
        {
            var song = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Customize(c => c.RandomOrdering())
                .FirstAsync();
            return song;
        }

        private async Task<Song> GetSongDto(
            Song song,
            SongPick pickReason)
        {
            var user = await GetUser();
            if (user != null)
            {
                var songLikeId = Like.GetLikeId(user.Id, song.Id);
                var songLike = await DbSession.LoadOptionAsync<Like>(songLikeId);
                var status = songLike.Match(l => l.Status, () => LikeStatus.None);
                return song.ToDto(status, pickReason);
            }

            return song.ToDto();
        }

        private async Task<List<Song>> QuerySongSearchSuggestions(
            Expression<Func<Song, object>> field,
            string searchText)
        {
            var suggestResults = await DbSession
                .Query<Song, Songs_Search>()
                .SuggestUsing(b => b.ByField(field, searchText))
                .ExecuteAsync();
            var firstSuggestion = suggestResults
                .FirstOrNone()
                .Map(f => f.Value)
                .NotNull()
                .Map(f => f.Suggestions.FirstOrDefault())
                .ValueOrDefault();
            if (firstSuggestion != null)
            {
                // Run the query for that suggestion.
                return await DbSession
                    .Query<Song, Songs_Search>()
                    .Search(field, firstSuggestion)
                    .ToListAsync();
            }

            return new List<Song>(0);
        }
    }
}
