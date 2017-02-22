using BitShuva.Common;
using BitShuva.Models;
using Raven.Client.Linq;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Threading.Tasks;
using BitShuva.Models.Indexes;
using BitShuva.Interfaces;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/songs")]
    [JwtSession]
    public class SongsController : RavenApiController
    {
        private ILoggerService _logger;

        public SongsController(ILoggerService logger)
        {
            _logger = logger;
        }
        [HttpGet]
        [Route("GetRecentPlays")]
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
        [Route("GetRandomLikedSongs")]
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
        [Route("GetLikedSongs")]
        public async Task<PagedList<Song>> GetLikedSongs(int skip, int take)
        {
            var user = await this.GetCurrentUser();
            if (user == null)
            {
                return new PagedList<Song>();
            }

            var stats = default(RavenQueryStatistics);
            var likedSongIds = await this.DbSession
                .Query<Like>()
                .Customize(x => x.Include<Like>(l => l.SongId))
                .Statistics(out stats)
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

        [HttpDelete]
        [Route("admin/delete/{*songId}")]
        public async Task Delete(string songId)
        {
            await this.RequireAdminUser();

            var song = await this.DbSession.LoadAsync<Song>(songId);
            if (song != null)
            {
                this.DbSession.Delete(song);
                //mvk
                //var errorLog = default(ChavahLog);
                try
                {
                    await Task.Run(() => CdnManager.DeleteFromCdn(song));
                }
                catch (Exception error)
                {
                    string ex = $"Song deleted from the database, but unable to delete from CDN. Song Id ={songId}{Environment.NewLine} Error message: { error.Message}{Environment.NewLine} Stack trace: { error.StackTrace}";
                    //mvk
                    // If we can't delete the file, no worries, we've already removed it from the database.
                    //errorLog = new ChavahLog
                    //{
                    //    Message = ex
                    //};

                    await _logger.Error(ex, ex.ToString());

                }
                //mvk
                //if (errorLog != null)
                //{
                //    await this.DbSession.StoreAsync(errorLog);
                //    this.DbSession.AddRavenExpiration(errorLog, DateTime.Now.AddDays(30));
                //}

                await this.DbSession.SaveChangesAsync();
            }
        }

        [HttpPost]
        [Route("admin/save")]
        public async Task<Song> Save(Song song)
        {
            await this.RequireAdminUser();

            var dbSong = await this.DbSession.LoadAsync<Song>(song.Id);
            dbSong.Artist = song.Artist;
            dbSong.Album = song.Album;
            dbSong.CommunityRank = song.CommunityRank;
            dbSong.Name = song.Name;
            dbSong.Number = song.Number;
            dbSong.PurchaseUri = song.PurchaseUri;
            dbSong.AlbumArtUri = song.AlbumArtUri;
            dbSong.Genres = song.Genres;
            dbSong.Tags = song.Tags;
            dbSong.Lyrics = song.Lyrics;

            await this.DbSession.StoreAsync(dbSong);
            await this.DbSession.SaveChangesAsync();

            return dbSong;
        }

        [Route("search")]
        public async Task<IEnumerable<Song>> GetSongsMatches(string searchText)
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
            if (results.Count == 0)
            {
                var suggestResults = await makeQuery()(searchText + "*").SuggestAsync();
                var suggestions = suggestResults.Suggestions;
                var firstSuggestion = suggestions.FirstOrDefault();
                if (firstSuggestion != null)
                {
                    var newQuery = makeQuery();
                    var suggestedResults = await newQuery(firstSuggestion).ToListAsync();
                    return suggestedResults.Select(r => r.ToDto());
                }
            }

            return results.Select(r => r.ToDto());
        }

        [Route("get")]
        public async Task<Song> GetSong()
        {            
            // This is NOT an unbounded result set:
            // This queries the Songs_RankStandings index, which will reduce the results. Max number of results will be the number of CommunityRankStanding enum constants.
            var songRankStandings = await this.DbSession
                .Query<Song, Songs_RankStandings>()
                .As<Songs_RankStandings.Results>()
                .ToListAsync();

            var user = await this.GetCurrentUser();
            if (user != null)
            {
                var song = await PickSongForUser(user, songRankStandings);
                return song;
            }
            
            return await PickSongForAnonymousUser(songRankStandings);
        }

        private async Task<Song> PickSongForAnonymousUser(IList<Songs_RankStandings.Results> songRankStandings)
        {
            var veryPoorRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.VeryPoor).Select(s => s.Count).FirstOrDefault();
            var poorRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Poor).Select(s => s.Count).FirstOrDefault();
            var normalRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Normal).Select(s => s.Count).FirstOrDefault();
            var goodRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Good).Select(s => s.Count).FirstOrDefault();
            var greatRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Great).Select(s => s.Count).FirstOrDefault();
            var bestRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Best).Select(s => s.Count).FirstOrDefault();
            var songPick = new UserSongPreferences().PickSong(
                veryPoorRankSongCount,
                poorRankSongCount,
                normalRankSongCount,
                goodRankSongCount,
                greatRankSongCount,
                bestRankSongCount);
            var pickRankedSong = new Func<CommunityRankStanding, Func<Task<Song>>>
                (standing => new Func<Task<Song>>(() => PickRankedSongForAnonymousUser(standing)));
            var songPicker = Match.Value(songPick)
                .With(SongPick.VeryPoorRank, pickRankedSong(CommunityRankStanding.VeryPoor))
                .With(SongPick.PoorRank, pickRankedSong(CommunityRankStanding.Poor))
                .With(SongPick.NormalRank, pickRankedSong(CommunityRankStanding.Normal))
                .With(SongPick.GoodRank, pickRankedSong(CommunityRankStanding.Good))
                .With(SongPick.GreatRank, pickRankedSong(CommunityRankStanding.Great))
                .With(SongPick.BestRank, pickRankedSong(CommunityRankStanding.Best))
                .DefaultTo(() => PickRandomSong())
                .Evaluate();
            var song = await songPicker();
            if (song == null)
            {
                song = await PickRandomSong();
            }

            return song.ToDto(LikeStatus.None, songPick);
        }

        private async Task<Song> PickRankedSongForAnonymousUser(CommunityRankStanding rank)
        {
            return await this.DbSession.Query<Song>()
                .Customize(x => x.RandomOrdering())
                .Where(s => s.CommunityRankStanding == rank)
                .FirstOrDefaultAsync();
        }

        [JwtSession]
        [Route("batch")]
        public async Task<IEnumerable<Song>> GetBatch()
        {
            const int songsInBatch = 5;
            var user = await this.GetCurrentUser();
            
            var songRankStandings = await this.DbSession
                .Query<Song, Songs_RankStandings>()
                .As<Songs_RankStandings.Results>()
                .ToListAsync();
                
            var batch = new List<Song>(songsInBatch);
            for (var i = 0; i < songsInBatch; i++)
            {
                var song = default(Song);
                if (user != null)
                {
                    song = await PickSongForUser(user, songRankStandings);
                }
                else
                {
                    song = await PickSongForAnonymousUser(songRankStandings);
                }

                batch.Add(song);
            }

            return batch;
        }

        [Route("GetById")]
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
        [Route("completed")]
        public async Task SongCompleted(string songId)
        {
            var user = await this.GetCurrentUser();
            if (user != null)
            {
                user.TotalPlays++;
                user.LastSeen = DateTime.UtcNow;
                user.RecentSongIds.Insert(0, songId);
                if (user.RecentSongIds.Count > 10)
                {
                    user.RecentSongIds = user.RecentSongIds
                        .Take(10)
                        .ToList();
                }
            }

            var song = await this.DbSession.LoadAsync<Song>(songId);
            if (song != null)
            {
                song.TotalPlays++;
            }
        }

        [Route("GetByArtistAndAlbum")]
        [HttpGet]
        public async Task<Song> GetByArtistAndAlbum(string artist, string album)
        {
            var songOrNull = await this.DbSession
                    .Query<Song>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.Album == album && s.Artist == artist);
            if (songOrNull == null)
            {
                await _logger.Warn("Couldn't find song by artist and album", new { Artist = artist, Album = album });
                //mvk
                //await ChavahLog.Warn(DbSession, "Couldn't find song by artist and album", new { Artist = artist, Album = album });
                return null;
            }

            return await this.GetSongDto(songOrNull, SongPick.SongFromAlbumRequested);
        }
        
        [Route("getByAlbum")]
        public async Task<Song> GetSongByAlbum(string album)
        {
            var albumUnescaped = Uri.UnescapeDataString(album);
            var songOrNull = await this.DbSession
                    .Query<Song>()
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync(s => s.Album == albumUnescaped);
            if (songOrNull != null)
            {
                return await GetSongDto(songOrNull, SongPick.SongFromAlbumRequested);
            }

            return null;
        }

        [Route("getByArtist")]
        [HttpGet]
        public async Task<Song> GetByArtist(string artist)
        {
            var artistUnescaped = Uri.UnescapeDataString(artist);
            var songOrNull = await this.DbSession
                .Query<Song>()
                .Customize(c => c.RandomOrdering())
                .FirstOrDefaultAsync(s => s.Artist == artistUnescaped);

            if (songOrNull != null)
            {
                return await GetSongDto(songOrNull, SongPick.SongFromArtistRequested);
            }

            return null;
        }

        [Route("trending")]
        public async Task<IEnumerable<Song>> GetTrendingSongs(int count)
        {
            var recentLikedSongIds = await this.DbSession
                .Query<Like>()
                .Customize(c => c.Include<Like>(l => l.SongId))
                .Where(l => l.Status == LikeStatus.Like)
                .OrderByDescending(l => l.Date)
                .Select(l => l.SongId)
                .Take(count + 10)
                .ToListAsync();
            var distinctSongIds = recentLikedSongIds
                .Distinct()
                .Take(count);

            var matchingSongs = await this.DbSession.LoadAsync<Song>(distinctSongIds);
            return matchingSongs
                .Where(s => s != null)
                .Select(s => s.ToDto());
        }
        
        [Route("top")]
        public async Task<IEnumerable<Song>> GetTopSongs(int count)
        {
            var randomSpotInTop70 = new Random().Next(0, 70);
            var songs = await this.DbSession
                .Query<Song>()
                .Customize(x => x.RandomOrdering())
                .OrderByDescending(s => s.CommunityRank)
                .Skip(randomSpotInTop70)
                .Take(count)
                .ToListAsync();

            return songs.Select(s => s.ToDto(LikeStatus.None, SongPick.RandomSong));
        }

        [Route("heavenly70")]
        public async Task<IEnumerable<Song>> GetHeavenly70()
        {
            return await this.DbSession
                .Query<Song>()
                .OrderByDescending(s => s.CommunityRank)
                .Take(70)
                .ToListAsync();
        }

        [HttpGet]
        [Route("patchupsongranks")]
        public async Task<string> PatchUpSongRanks(int skip = 0, int take = 500)
        {
            var communityRankStats = await this.DbSession
                    .Query<Song, Songs_AverageCommunityRank>()
                    .As<Songs_AverageCommunityRank.Results>()
                    .FirstOrDefaultAsync();

            var songs = await this.DbSession.Query<Song>()
                .OrderBy(s => s.Name)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            int patchedCount = 0;
            foreach (var song in songs)
            {
                var averageSongRank = communityRankStats != null ? communityRankStats.RankAverage : 0;
                var newStanding = Match.Value(song.CommunityRank)
                    .With(v => v <= -5, CommunityRankStanding.VeryPoor)
                    .With(v => v <= -1, CommunityRankStanding.Poor)
                    .With(v => v <= averageSongRank * 2, CommunityRankStanding.Normal)
                    .With(v => v <= averageSongRank * 4, CommunityRankStanding.Good)
                    .With(v => v <= averageSongRank * 6, CommunityRankStanding.Great)
                    .DefaultTo(CommunityRankStanding.Best)
                    .Evaluate();
                if (song.CommunityRankStanding != newStanding)
                {
                    patchedCount++;
                    song.CommunityRankStanding = newStanding;
                }
            }

            return $"Looked at {songs.Count}, patched {patchedCount}";
        }

        [HttpPost]
        [Route("audioFailed")]
        public async Task<AudioErrorInfo> AudioFailed(AudioErrorInfo errorInfo)
        {
            errorInfo.UserId = this.SessionToken?.UserId;
            await _logger.Error("Audio playback failed", "", errorInfo);
            //mvk
            //await ChavahLog.Error(DbSession, "Audio playback failed", "", errorInfo);
            return errorInfo;
        }

        private async Task<Song> PickSongForUser(ApplicationUser user, IList<Songs_RankStandings.Results> songRankStandings)
        {
            var veryPoorRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.VeryPoor).Select(s => s.Count).FirstOrDefault();
            var poorRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Poor).Select(s => s.Count).FirstOrDefault();
            var normalRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Normal).Select(s => s.Count).FirstOrDefault();
            var goodRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Good).Select(s => s.Count).FirstOrDefault();
            var greatRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Great).Select(s => s.Count).FirstOrDefault();
            var bestRankSongCount = songRankStandings.Where(s => s.Standing == CommunityRankStanding.Best).Select(s => s.Count).FirstOrDefault();

            var pickRankedSong = new Func<CommunityRankStanding, Func<Task<Song>>>(standing => new Func<Task<Song>>(() => PickRankedSongForUser(standing, user)));
            var songPick = user.Preferences.PickSong(veryPoorRankSongCount, poorRankSongCount, normalRankSongCount, goodRankSongCount, greatRankSongCount, bestRankSongCount);
            var songPicker = Match.Value(songPick)
                .With(SongPick.VeryPoorRank, pickRankedSong(CommunityRankStanding.VeryPoor))
                .With(SongPick.PoorRank, pickRankedSong(CommunityRankStanding.Poor))
                .With(SongPick.NormalRank, pickRankedSong(CommunityRankStanding.Normal))
                .With(SongPick.GoodRank, pickRankedSong(CommunityRankStanding.Good))
                .With(SongPick.GreatRank, pickRankedSong(CommunityRankStanding.Great))
                .With(SongPick.BestRank, pickRankedSong(CommunityRankStanding.Best))
                .With(SongPick.LikedAlbum, () => PickLikedAlbumForUser(user))
                .With(SongPick.LikedArtist, () => PickLikedArtistForUser(user))
                .With(SongPick.LikedSong, () => PickLikedSongForUser(user))
                .With(SongPick.RandomSong, PickRandomSong)
                .Evaluate();
            var song = await songPicker();
            if (song == null)
            {
                song = await PickRandomSong();
            }

            return song.ToDto(user.Preferences.GetLikeStatus(song), songPick);
        }

        private async Task<Song> PickRandomSong()
        {
            return await this.DbSession
                .Query<Song>()
                .Customize(c => c.RandomOrdering())
                .FirstAsync();
        }

        private async Task<Song> PickLikedSongForUser(ApplicationUser user)
        {
            var randomLikedSong = user.Preferences.Songs.Where(s => s.LikeCount == 1).RandomElement();
            if (randomLikedSong != null)
            {
                return await this.DbSession.LoadAsync<Song>(randomLikedSong.Name);
            }

            return null;
        }

        private async Task<Song> PickLikedArtistForUser(ApplicationUser user)
        {
            var randomLikedArtist = user.Preferences.GetLikedArtists().RandomElement();
            if (randomLikedArtist != null)
            {
                return await this.DbSession
                    .Query<Song>()
                    .Customize(c => c.RandomOrdering())
                    .Where(s => s.Artist == randomLikedArtist.Name)
                    .FirstOrDefaultAsync();
            }

            return null;
        }

        private async Task<Song> PickLikedAlbumForUser(ApplicationUser user)
        {
            var randomLikedAlbum = user.Preferences.GetLikedAlbums().RandomElement();
            if (randomLikedAlbum != null)
            {
                return await this.DbSession
                    .Query<Song>()
                    .Where(s => s.Album == randomLikedAlbum.Name)
                    .Customize(c => c.RandomOrdering())
                    .FirstOrDefaultAsync();
            }

            return null;
        }

        private async Task<Song> PickRankedSongForUser(CommunityRankStanding rank, ApplicationUser user)
        {
            var dislikedSongIds = user
                .Preferences
                .GetDislikedSongs()
                .Select(s => s.Name)
                .ToArray();
            
            return await this.DbSession
                .Query<Song>()
                .Customize(x => x.RandomOrdering(Guid.NewGuid().ToString()))
                .Where(s => s.CommunityRankStanding == rank && !s.Id.In(dislikedSongIds))
                .FirstOrDefaultAsync();
        }

        private async Task<Song> GetSongDto(Song song, SongPick pickReason)
        {
            var user = await this.GetCurrentUser();
            if (user != null)
            {
                var songLike = await this.DbSession
                    .Query<Like>()
                    //.Customize(c => c.Include<Like>(l => l.SongId))
                    .FirstOrDefaultAsync(s => s.UserId == user.Id && s.SongId == song.Id);

                return song.ToDto(songLike.StatusOrNone(), pickReason);
            }

            return song.ToDto();
        }
    }
}