using BitShuva.Common;
using BitShuva.Models;
using BitShuva.Models.Indexes;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/likes")]
    public class LikesController : UserContextController
    {
        [Route("random/{count}")]
        public async Task<IEnumerable<Song>> GetRandomLikedSongs(int count)
        {
            var user = await this.GetLoggedInUserOrNull();
            if (user == null)
            {
                return new Song[0]; 
            }

            var likedSongIds = await this.Session
                .Query<Like>()
                .Customize(x => x.RandomOrdering())
                .Customize(x => x.Include<Like>(l => l.SongId))
                .Where(l => l.Status == LikeStatus.Like && l.UserId == user.Id)
                .Select(l => l.SongId)
                .Take(count)
                .ToListAsync();

            var loadedSongs = await this.Session.LoadAsync<Song>(likedSongIds);
            return loadedSongs
                .Where(s => s != null)
                .Select(s => s.ToDto());
        }

        [Route("songs/{skip}/{take}")]
        public async Task<PagedList<Song>> GetLikedSongs(int skip, int take)
        {
            var user = await this.GetLoggedInUserOrNull();
            if (user == null)
            {
                return new PagedList<Song>();
            }

            var stats = default(RavenQueryStatistics);
            var likedSongIds = await this.Session
                .Query<Like>()
                .Customize(x => x.Include<Like>(l => l.SongId))
                .Statistics(out stats)
                .Where(l => l.Status == LikeStatus.Like && l.UserId == user.Id)
                .OrderByDescending(l => l.Date)
                .Select(l => l.SongId)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            var songs = await this.Session.LoadAsync<Song>(likedSongIds);
            return new PagedList<Song>
            {
                Items = songs.Where(s => s != null).ToArray(),
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        [Authorize]
        [HttpPost]
        [Route("like/{*songId}")]
        public async Task<int> Like(string songId)
        {
            return await UpdateLikeStatus(songId, LikeStatus.Like);
        }

        [Authorize]
        [HttpPost]
        [Route("dislike/{*songId}")]
        public async Task<int> Dislike(string songId)
        {
            return await UpdateLikeStatus(songId, LikeStatus.Dislike);
        }

        [Route("upDownVotes/{*songId}")]
        public async Task<dynamic> GetUpDownVotes(string songId)
        {
            var upVoteCount = await this.Session.Query<Like>().CountAsync(l => l.SongId == songId && l.Status == LikeStatus.Like);
            var downVoteCount = await this.Session.Query<Like>().CountAsync(l => l.SongId == songId && l.Status == LikeStatus.Dislike);
            return new
            {
                UpVotes = upVoteCount,
                DownVotes = downVoteCount,
                SongId = songId
            };
        }

        private async Task<int> UpdateLikeStatus(string songId, LikeStatus likeStatus)
        {
            var user = await this.GetLoggedInUserOrNull();
            var song = await this.Session.LoadAsync<Song>(songId);
            if (user == null || song == null)
            {
                var errorLog = new ChavahLog
                {
                    Message = "User updated like status, even though user or song wasn't found. UserID = " + (user == null ? "[null]" : user.Id) + ", SongID = " + (song == null ? "[null]" : song.Id)
                };
                await this.Session.StoreAsync(errorLog);
                this.Session.AddRavenExpiration(errorLog, DateTime.UtcNow.AddDays(30));
                throw new Exception("Couldn't find user or song. Check server log.");
            }

            var isReversal = false;
            var isNoChange = false;
            var existingLike = await this.Session
                .Query<Like>()
                .Customize(x => x.WaitForNonStaleResultsAsOfLastWrite(TimeSpan.FromSeconds(10)))
                .FirstOrDefaultAsync(l => l.SongId == songId && l.UserId == user.Id);
            if (existingLike != null)
            {
                isReversal = existingLike.Status != likeStatus;
                isNoChange = existingLike.Status == likeStatus;
                existingLike.Status = likeStatus;
                await this.Session.StoreAsync(existingLike);
            }
            else
            {
                var newLikeStatus = new Like()
                {
                    Status = likeStatus,
                    SongId = songId,
                    UserId = user.Id,
                    Date = DateTime.Now
                };
                await this.Session.StoreAsync(newLikeStatus);
                
                if (likeStatus == LikeStatus.Like)
                {
                    var songRankString = Match
                        .Value(song.CommunityRank)
                        .With(i => i > 0, "+")
                        .DefaultTo("")
                        .Evaluate() + song.CommunityRank.ToString();
                    var songArtist = song.Artist;
                    var activity = new Activity
                    {
                        DateTime = DateTime.Now,
                        Title = string.Format("{0} - {1} was thumbed up ({2}) on Chavah Messianic Radio", song.Artist, song.Name, songRankString),
                        Description = string.Format("\"{0}\" by {1} was thumbed up ({2}) on Chavah Messianic Radio.", song.Name, songArtist, songRankString),
                        MoreInfoUri = song.GetSongShareLink()
                    };

                    await this.Session.StoreAsync(activity);
                    this.Session.AddRavenExpiration(activity, DateTime.UtcNow.AddDays(7));
                }
            }

            // Update the community rank.
            if (song != null)
            {
                var multiplier = isReversal ? 2 : isNoChange ? 0 : 1;
                var changePositiveOrNegative = likeStatus == LikeStatus.Like ? 1 : -1;
                song.CommunityRank = song.CommunityRank + (multiplier * changePositiveOrNegative);
                user.Preferences.Update(song, likeStatus);

                var communityRankStats = await this.Session
                    .Query<Song, Songs_AverageCommunityRank>()
                    .As<Songs_AverageCommunityRank.Results>()
                    .FirstOrDefaultAsync();
                var averageSongRank = communityRankStats != null ? communityRankStats.RankAverage : 0;
                var newStanding = Match.Value(song.CommunityRank)
                    .With(v => v <= -5, CommunityRankStanding.VeryPoor)
                    .With(v => v <= -1, CommunityRankStanding.Poor)
                    .With(v => v <= averageSongRank * 2, CommunityRankStanding.Normal)
                    .With(v => v <= averageSongRank * 4, CommunityRankStanding.Good)
                    .With(v => v <= averageSongRank * 6, CommunityRankStanding.Great)
                    .DefaultTo(CommunityRankStanding.Best)
                    .Evaluate();
                song.CommunityRankStanding = newStanding;

                return song.CommunityRank;
            }

            return 0;
        }
    }
}