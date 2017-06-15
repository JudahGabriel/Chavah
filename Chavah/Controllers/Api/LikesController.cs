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
    [JwtSession]
    [RoutePrefix("api/likes")]
    public class LikesController : RavenApiController
    {
        [HttpPost]
        [Route("like")]
        public async Task<int> Like(string songId)
        {
            return await UpdateLikeStatus(songId, LikeStatus.Like);
        }
        
        [HttpPost]
        [Route("dislike")]
        public async Task<int> Dislike(string songId)
        {
            return await UpdateLikeStatus(songId, LikeStatus.Dislike);
        }

        [Route("upDownVotes")]
        public async Task<dynamic> GetUpDownVotes(string songId)
        {
            var upVoteCount = await this.DbSession.Query<Like>().CountAsync(l => l.SongId == songId && l.Status == LikeStatus.Like);
            var downVoteCount = await this.DbSession.Query<Like>().CountAsync(l => l.SongId == songId && l.Status == LikeStatus.Dislike);
            return new
            {
                UpVotes = upVoteCount,
                DownVotes = downVoteCount,
                SongId = songId
            };
        }

        private async Task<int> UpdateLikeStatus(string songId, LikeStatus likeStatus)
        {
            var user = await this.GetCurrentUser();
            var song = await this.DbSession.LoadAsync<Song>(songId);
            if (user == null || song == null)
            {
                throw new Exception($"User updated like status, even though user or song wasn't found. UserID = {user?.Id}, SongID = {song?.Id}");
            }

            var isReversal = false;
            var isNoChange = false;
            var existingLike = await this.DbSession
                .Query<Like>()
                .Customize(x => x.WaitForNonStaleResultsAsOfLastWrite(TimeSpan.FromSeconds(10)))
                .FirstOrDefaultAsync(l => l.SongId == songId && l.UserId == user.Id);
            if (existingLike != null)
            {
                isReversal = existingLike.Status != likeStatus;
                isNoChange = existingLike.Status == likeStatus;
                existingLike.Status = likeStatus;
                await this.DbSession.StoreAsync(existingLike);
            }
            else
            {
                var newLikeStatus = new Like
                {
                    Status = likeStatus,
                    SongId = songId,
                    UserId = user.Id,
                    Date = DateTime.Now
                };
                await this.DbSession.StoreAsync(newLikeStatus);
                
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

                    await this.DbSession.StoreAsync(activity);
                    this.DbSession.AddRavenExpiration(activity, DateTime.UtcNow.AddDays(7));
                }
            }

            // Update the community rank.
            var multiplier = isReversal ? 2 : isNoChange ? 0 : 1;
            var changePositiveOrNegative = likeStatus == LikeStatus.Like ? 1 : -1;
            song.CommunityRank = song.CommunityRank + (multiplier * changePositiveOrNegative);

            var communityRankStats = await this.DbSession
                .Query<Song, Songs_AverageCommunityRank>()
                .As<Songs_AverageCommunityRank.Results>()
                .FirstOrDefaultAsync();
            var averageSongRank = communityRankStats != null ? communityRankStats.RankAverage : 0;
            var newStanding = Match.Value(song.CommunityRank)
                .With(v => v <= -5, CommunityRankStanding.VeryPoor)
                .With(v => v <= -3, CommunityRankStanding.Poor)
                .With(v => v <= (averageSongRank * 1.5), CommunityRankStanding.Normal)
                .With(v => v <= (averageSongRank * 2.0), CommunityRankStanding.Good)
                .With(v => v <= (averageSongRank * 4.0), CommunityRankStanding.Great)
                .DefaultTo(CommunityRankStanding.Best)
                .Evaluate();
            song.CommunityRankStanding = newStanding;

            return song.CommunityRank;
        }
    }
}