using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Options;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class SongRequestsController : RavenController
    {
        private readonly ApplicationOptions _appOptions;
        private readonly TimeSpan _songRequestValidTime = TimeSpan.FromMinutes(20);

        public SongRequestsController(
            IAsyncDocumentSession dbSession,
            ILogger<SongRequestsController> logger,
            IOptionsMonitor<ApplicationOptions> appOptions)
            : base(dbSession, logger)
        {
            _appOptions = appOptions.CurrentValue;
        }

        /// <summary>
        /// Finds a pending song request for the current user.
        /// A song request is considered pending if:
        /// 1. It was recently requested
        /// 2. The user hasn't played it yet
        /// 3. The user doesn't dislike the requested song.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<string> GetPending()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            var recent = DateTime.UtcNow.Subtract(_songRequestValidTime);
            var pendingSongReqs = await DbSession
                 .Query<SongRequest>()
                 .OrderByDescending(r => r.DateTime)
                 .Where(r => r.DateTime >= recent)
                 .Take(10)
                 .ToListAsync();

            var validSongRequest = pendingSongReqs
                .OrderBy(d => d.DateTime) // OrderBy to give us the oldest of the pending song requests first.
                .FirstOrDefault(s => !s.PlayedForUserIds.Contains(userId));
            var updatedSongRequest = default(SongRequest);
            if (validSongRequest != null)
            {
                updatedSongRequest = await AddUserToSongRequestPlayedList(validSongRequest, userId);
            }

            // We've got a valid song request. Verify the user hasn't disliked this song.
            if (updatedSongRequest != null)
            {
                var songLikeId = Like.GetLikeId(userId, updatedSongRequest.SongId);
                var songLike = await DbSession.LoadOptionAsync<Like>(songLikeId);
                var userDislikesSong = songLike.Exists(l => l.Status == LikeStatus.Dislike);
                if (!userDislikesSong)
                {
                    return updatedSongRequest.SongId;
                }
            }

            return null;
        }

        [HttpGet]
        public Task<List<string>> GetRecentRequestedSongIds()
        {
            var recent = DateTime.UtcNow.Subtract(_songRequestValidTime);
            return DbSession
                 .Query<SongRequest>()
                 .OrderByDescending(r => r.DateTime)
                 .Where(r => r.DateTime >= recent)
                 .Select(r => r.SongId)
                 .Take(10)
                 .ToListAsync();
        }

        [HttpPost]
        public async Task RequestSong(string songId)
        {
            var user = await GetUserOrThrow();
            var song = await DbSession.LoadAsync<Song>(songId);

            if (song != null)
            {
                var requestExpiration = DateTime.UtcNow.AddDays(10);
                var hasSongBeenRecentlyRequested = await HasSongBeenRequestedRecently(songId);
                var hasManyRequestForArtist = await HasManyPendingSongRequestForArtist(song.Artist);
                var hasManySongRequestsFromUser = await HasManyRecentSongRequestsFromUser(user.Id);
                var isPoorlyRated = song.CommunityRankStanding == CommunityRankStanding.VeryPoor;
                if (!hasSongBeenRecentlyRequested && !hasManyRequestForArtist && !hasManySongRequestsFromUser && !isPoorlyRated)
                {
                    user.TotalSongRequests++;
                    var songRequest = new SongRequest
                    {
                        DateTime = DateTime.UtcNow,
                        PlayedForUserIds = new List<string> { user.Id },
                        SongId = songId,
                        Artist = song.Artist,
                        Name = song.Name,
                        UserId = user.Id
                    };
                    await DbSession.StoreAsync(songRequest);
                    DbSession.SetRavenExpiration(songRequest, requestExpiration);
                    // Store an activity for the song request.
                    var activity = new Activity
                    {
                        DateTime = DateTime.UtcNow,
                        Title = $"{song.Artist} - {song.Name} was requested by one of our listeners",
                        Description = $"\"{song.Name}\" by {song.Artist} was requested by one of our listeners on {_appOptions?.Title}.",
                        MoreInfoUri = song.GetSongShareLink(_appOptions?.DefaultUrl),
                        EntityId = song.Id,
                        Type = ActivityType.Request
                    };
                    await DbSession.StoreAsync(activity);
                    DbSession.SetRavenExpiration(activity, requestExpiration);
                }
            }
        }

        /// <summary>
        /// Marks songs played for the current user.
        /// </summary>
        /// <param name="songIds"></param>
        /// <returns></returns>
        [HttpPost]
        [Authorize]
        public async Task<List<string>> MarkAsPlayed([FromBody] List<string> songIds)
        {
            var userId = GetUserIdOrThrow();
            var recent = DateTime.UtcNow.Subtract(_songRequestValidTime);
            var recentSongRequests = await DbSession
                 .Query<SongRequest>()
                 .Where(r => r.DateTime >= recent)
                 .Take(10)
                 .ToListAsync();
            recentSongRequests
                .Where(req =>
                    songIds.Contains(req.SongId, StringComparison.OrdinalIgnoreCase)
                    && !req.PlayedForUserIds.Contains(userId, StringComparison.OrdinalIgnoreCase))
                .ForEach(req => req.PlayedForUserIds.Add(userId));
            return songIds;
        }

        private async Task<bool> HasSongBeenRequestedRecently(string songId)
        {
            var recent = DateTime.UtcNow.Subtract(TimeSpan.FromMinutes(120));
            return await DbSession
                .Query<SongRequest>()
                .AnyAsync(s => s.SongId == songId && s.DateTime >= recent);
        }

        private async Task<bool> HasManyPendingSongRequestForArtist(string artist)
        {
            var recent = DateTime.UtcNow.Subtract(TimeSpan.FromMinutes(30));
            var many = 1;
            return await DbSession
                .Query<SongRequest>()
                .CountAsync(s => s.Artist == artist && s.DateTime >= recent) >= many;
        }

        private async Task<bool> HasManyRecentSongRequestsFromUser(string userId)
        {
            var recent = DateTime.UtcNow.Subtract(TimeSpan.FromMinutes(30));
            const int maxInHalfHour = 2;
            var recentSongRequestsFromUser = await DbSession
                .Query<SongRequest>()
                .CountAsync(s => s.UserId == userId && s.DateTime >= recent);
            return recentSongRequestsFromUser >= maxInHalfHour;
        }

        private async Task<SongRequest> AddUserToSongRequestPlayedList(SongRequest req, string userId)
        {
            req.PlayedForUserIds.Add(userId);
            try
            {
                await DbSession.SaveChangesAsync();
                return req;
            }
            catch (Raven.Client.Exceptions.ConcurrencyException)
            {
                // We get this error often as this song request will get updated frequently in a brief period of time.
                // In such a case, try loading it directly from storage, rather than queried from index.
                DbSession.Advanced.Evict(req);
                var refreshedSongRequest = await DbSession.LoadAsync<SongRequest>(req.Id);
                if (refreshedSongRequest?.PlayedForUserIds.Contains(userId) == false)
                {
                    refreshedSongRequest.PlayedForUserIds.Add(userId);
                    await DbSession.SaveChangesAsync();
                    return refreshedSongRequest;
                }

                return null;
            }
        }
    }
}
