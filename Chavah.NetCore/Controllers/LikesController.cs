using System;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Settings;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class LikesController : RavenController
    {
        private readonly AppSettings _appOptions;

        public LikesController(
            IAsyncDocumentSession dbSession,
            ILogger<LikesController> logger,
            IOptionsMonitor<AppSettings> appOptions) : base(dbSession, logger)
        {
            _appOptions = appOptions.CurrentValue;
        }

        [HttpPost]
        public async Task<int> Like(string songId)
        {
            return await UpdateLikeStatus(songId, LikeStatus.Like);
        }

        [HttpPost]
        public Task<int> Dislike(string songId)
        {
            return UpdateLikeStatus(songId, LikeStatus.Dislike);
        }

        [HttpGet]
        public async Task<dynamic> GetUpDownVotes(string songId)
        {
            var upVoteCount = await DbSession.Query<Like>().CountAsync(l => l.SongId == songId && l.Status == LikeStatus.Like);
            var downVoteCount = await DbSession.Query<Like>()
                .CountAsync(l => l.SongId == songId && l.Status == LikeStatus.Dislike);
            return new
            {
                UpVotes = upVoteCount,
                DownVotes = downVoteCount,
                SongId = songId
            };
        }

        private async Task<int> UpdateLikeStatus(string songId, LikeStatus likeStatus)
        {
            var user = await GetUserOrThrow();
            var song = await DbSession.LoadAsync<Song>(songId);
            if (song == null)
            {
                throw new InvalidOperationException("User attempted to update like status, but song wasn't found.")
                    .WithData("User ID", user.Id)
                    .WithData("Song ID", songId);
            }

            var isReversal = false;
            var isNoChange = false;

            var likeId = $"Likes/{user.Id}/{songId}";
            var existingLike = await DbSession.LoadAsync<Like>(likeId);
            if (existingLike != null)
            {
                isReversal = existingLike.Status != likeStatus;
                isNoChange = existingLike.Status == likeStatus;
                existingLike.Status = likeStatus;
            }
            else
            {
                var newLikeStatus = new Like
                {
                    Status = likeStatus,
                    SongId = songId,
                    UserId = user.Id,
                    Date = DateTime.UtcNow
                };
                await DbSession.StoreAsync(newLikeStatus, likeId);

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
                        DateTime = DateTime.UtcNow,
                        Title = $"{song.Artist} - {song.Name} was thumbed up ({songRankString}) on {_appOptions?.Title}",
                        Description = $"\"{song.Name}\" by {songArtist} was thumbed up ({songRankString}) on {_appOptions?.Title}.",
                        MoreInfoUri = song.GetSongShareLink(_appOptions?.DefaultUrl),
                        EntityId = song.Id,
                        Type = ActivityType.Like
                    };

                    await DbSession.StoreAsync(activity);
                    DbSession.SetRavenExpiration(activity, DateTime.UtcNow.AddDays(7));
                }
            }

            // Update the community rank.
            var multiplier = isReversal ? 2 : isNoChange ? 0 : 1;
            var changePositiveOrNegative = likeStatus == LikeStatus.Like ? 1 : -1;
            song.CommunityRank += (multiplier * changePositiveOrNegative);

            var communityRankStats = await DbSession
                .Query<Song, Songs_AverageCommunityRank>()
                .As<Songs_AverageCommunityRank.Results>()
                .FirstOrDefaultAsync();
            var averageSongRank = communityRankStats != null ? communityRankStats.RankAverage : 0;
            var newStanding = Match.Value(song.CommunityRank)
                .With(v => v <= -5, CommunityRankStanding.VeryPoor)
                .With(v => v <= -3, CommunityRankStanding.Poor)
                .With(v => v <= (averageSongRank * 1.2), CommunityRankStanding.Normal)
                .With(v => v <= (averageSongRank * 1.5), CommunityRankStanding.Good)
                .With(v => v <= (averageSongRank * 3.0), CommunityRankStanding.Great)
                .DefaultTo(CommunityRankStanding.Best)
                .Evaluate();
            song.CommunityRankStanding = newStanding;

            return song.CommunityRank;
        }
    }
}
