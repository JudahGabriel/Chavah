using BitShuva.Common;
using BitShuva.Models;
using Raven.Client.Linq;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web.Http;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using System.Web;
using System.IO;
using BitShuva.Models.Indexes;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/songs")]
    public class SongsController : UserContextController
    {
        [Route("admin/list/{skip}/{take}")]
        [Authorize]
        [HttpGet]
        public async Task<PagedList<Song>> AdminSongs(int skip, int take)
        {
            await this.EnsureIsAdminUser();

            var totalCount = await this.DbSession.Query<Song>().CountAsync();
            var results = await this.DbSession
                .Query<Song>()
                //.Customize(x => x.WaitForNonStaleResultsAsOfNow(TimeSpan.FromSeconds(5)))
                .Skip(skip)
                .Take(take)
                .OrderByDescending(o => o.UploadDate)
                .ToListAsync();

            return new PagedList<Song>
            {
                Total = totalCount,
                Items = results,
                Skip = skip,
                Take = take
            };
        }

        [HttpDelete]
        [Authorize]
        [Route("admin/delete/{*songId}")]
        public async Task Delete(string songId)
        {
            await this.EnsureIsAdminUser();

            var song = await this.DbSession.LoadAsync<Song>(songId);
            if (song != null)
            {
                this.DbSession.Delete(song);
                var errorLog = default(ChavahLog);
                try
                {
                    await Task.Run(() => song.DeleteFromCdn());
                }
                catch (Exception error)
                {
                    // If we can't delete the file, no worries, we've already removed it from the database.
                    errorLog = new ChavahLog
                    {
                        Message = string.Format("Song deleted from the database, but unable to delete from CDN. Song Id = {0}{1}Error message: {2}{1}Stack trace: {3}",
                            songId, Environment.NewLine, error.Message, error.StackTrace)
                    };
                }

                if (errorLog != null)
                {
                    await this.DbSession.StoreAsync(errorLog);
                    this.DbSession.AddRavenExpiration(errorLog, DateTime.Now.AddDays(30));
                }

                await this.DbSession.SaveChangesAsync();
            }
        }

        [HttpPost]
        [Authorize]
        [Route("admin/save")]
        public async Task<Song> Save(Song song)
        {
            await this.EnsureIsAdminUser();

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

            var user = await this.GetLoggedInUserOrNull();
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

            return song.ToDto();
        }

        private async Task<Song> PickRankedSongForAnonymousUser(CommunityRankStanding rank)
        {
            return await this.DbSession.Query<Song>()
                .Customize(x => x.RandomOrdering())
                .Where(s => s.CommunityRankStanding == rank)
                .FirstOrDefaultAsync();
        }

        [Route("batch")]
        public async Task<IEnumerable<Song>> GetBatch()
        {
            const int songsInBatch = 15;
            var user = await this.GetLoggedInUserOrNull();
            
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

        [Route("id/{*songId}")]
        public async Task<Song> GetSongById(string songId)
        {
            var song = await this.DbSession.LoadAsync<Song>(songId);
            return await this.GetSongDto(song);
        }

        [HttpPost]
        [Route("completed/{*songId}")]
        public async Task SongCompleted(string songId)
        {
            var user = await this.GetLoggedInUserOrNull();
            if (user != null)
            {
                user.TotalPlays++;
                user.LastSeen = DateTime.UtcNow;
            }

            var song = await this.DbSession.LoadAsync<Song>(songId);
            if (song != null)
            {
                song.TotalPlays++;
            }
        }

        public async Task<Song> GetSongByArtistAndAlbum(string artist, string album)
        {
            var song = await this.DbSession
                    .Query<Song>()
                    .Customize(c => c.RandomOrdering())
                    .FirstAsync(s => s.Album == album && s.Artist == artist);

            return await GetSongById(song.Id);
        }
        
        [Route("album/{album}")]
        public async Task<Song> GetSongByAlbum(string album)
        {
            var song = await this.DbSession
                    .Query<Song>()
                    .Customize(c => c.RandomOrdering())
                    .FirstAsync(s => s.Album == album);

            return await GetSongById(song.Id);
        }

        [Route("artist/{artist}")]
        public async Task<Song> GetSongByArtist(string artist)
        {
            var song = await this.DbSession
                .Query<Song>()
                .Customize(c => c.RandomOrdering())
                .FirstAsync(s => s.Artist == artist);

            return await GetSongById(song.Id);
        }

        [Route("trending/{count}")]
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
            var distinctSongIds = recentLikedSongIds.Distinct();

            var matchingSongs = await this.DbSession.LoadAsync<Song>(distinctSongIds);
            return matchingSongs
                .Where(s => s != null)
                .Select(s => s.ToDto());
        }
        
        [Route("top/{count}")]
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

            return songs.Select(s => s.ToDto(LikeStatus.None));
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

        //[HttpPost]
        //[Route("admin/upload")]
        //public async Task UploadSong(SongUpload upload)
        //{
        //    await this.EnsureIsAdminUser();

        //    // Upload process: 
        //    // 1. User uploads a song to FilePickr, giving us an HTTP address to the MP3.
        //    // 2. We store a new Song object in SongsController, sending the MP3's http address.
        //    // 3. We then grab the file and push it to our CDN via FTP. 

        //    var unescapedFileName = Uri.UnescapeDataString(upload.FileName);
        //    var song = Song.FromFileName(unescapedFileName);
        //    await this.Session.StoreAsync(song); // Gives us an Id, which is required for uploading to Cdn.

        //    var mp3Uri = await song.UploadMp3ToCdn(upload.Address);
        //    song.Uri = mp3Uri;
        //    song.UploadDate = DateTime.Now;
        //}
        
        private async Task<Song> PickSongForUser(User user, IList<Songs_RankStandings.Results> songRankStandings)
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

            return song.ToDto(user.Preferences.GetLikeStatus(song));
        }

        private async Task<Song> PickRandomSong()
        {
            return await this.DbSession
                .Query<Song>()
                .Customize(c => c.RandomOrdering())
                .FirstAsync();
        }

        private async Task<Song> PickLikedSongForUser(User user)
        {
            var randomLikedSong = user.Preferences.Songs.Where(s => s.LikeCount == 1).RandomElement();
            if (randomLikedSong != null)
            {
                return await this.DbSession.LoadAsync<Song>(randomLikedSong.Name);
            }

            return null;
        }

        private async Task<Song> PickLikedArtistForUser(User user)
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

        private async Task<Song> PickLikedAlbumForUser(User user)
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

        private async Task<Song> PickRankedSongForUser(CommunityRankStanding rank, User user)
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

        private async Task<Song> GetSongDto(Song song)
        {
            var user = await this.GetLoggedInUserOrNull();
            if (user != null)
            {
                var songLike = await this.DbSession
                    .Query<Like>()
                    .Customize(c => c.Include<Like>(l => l.SongId))
                    .FirstOrDefaultAsync(s => s.UserId == user.Id && s.SongId == song.Id);

                return song.ToDto(songLike.StatusOrNone());
            }

            return song.ToDto();
        }
    }
}