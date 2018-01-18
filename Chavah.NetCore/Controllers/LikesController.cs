using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class LikesController : RavenController
    {
        private readonly IOptions<AppSettings> options;

        public LikesController(IAsyncDocumentSession dbSession, 
                               ILogger<LikesController> logger,
                               IOptions<AppSettings> options)
            : base(dbSession, logger)
        {
            this.options = options;
        }
        
        [HttpPost]
        public async Task<int> Like(string songId)
        {
            return await UpdateLikeStatus(songId, LikeStatus.Like);
        }
        
        [HttpPost]
        public async Task<int> Dislike(string songId)
        {
            return await UpdateLikeStatus(songId, LikeStatus.Dislike);
        }
        
        [HttpGet]
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
            var likeId = $"Likes/{user.Id}/{songId}";
            if (user == null || song == null)
            {
                var error = new UnauthorizedAccessException($"User attempted to update like status, even though user or song wasn't found.");
                error.Data.Add("User ID", user?.Id);
                error.Data.Add("Song ID", song?.Id);
                throw error;
            }
            
            var isReversal = false;
            var isNoChange = false;
            
            var existingLike = await this.DbSession.LoadAsync<Like>(likeId);
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
                await this.DbSession.StoreAsync(newLikeStatus, likeId);
                
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
                        Title = $"{song.Artist} - {song.Name} was thumbed up ({songRankString}) on {options?.Value?.Application?.Title}",
                        Description = $"\"{song.Name}\" by {songArtist} was thumbed up ({songRankString}) on {options?.Value?.Application?.Title}.",
                        MoreInfoUri = song.GetSongShareLink(options?.Value?.Application?.DefaultUrl),
                        EntityId = song.Id,
                        Type = ActivityType.Like
                    };

                    await this.DbSession.StoreAsync(activity);
                    this.DbSession.SetRavenExpiration(activity, DateTime.UtcNow.AddDays(7));
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