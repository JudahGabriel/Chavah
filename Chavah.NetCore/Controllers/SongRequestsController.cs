using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
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
    //[JwtSession]
    [Route("api/requests")]
    public class SongRequestsController : RavenController
    {
        public SongRequestsController(
            IAsyncDocumentSession dbSession, 
            ILogger<SongRequestsController> logger)
            : base(dbSession, logger)
        {
        }

        [Route("pending")]
        public async Task<string> GetPendingRequestedSongId()
        {
            var user = await this.GetCurrentUser();
            if (user == null)
            {
                return null;
            }

            var recentSongRequests = await this.DbSession
                 .Query<SongRequest>()
                 .OrderByDescending(d => d.DateTime)
                 .Take(10)
                 .ToListAsync();
            
            var recent = DateTime.UtcNow.Subtract(TimeSpan.FromMinutes(30));
            var validSongRequest = recentSongRequests
                .OrderBy(d => d.DateTime) // OrderBy to give us the oldest of the recent song requests first.
                .FirstOrDefault(s => s.DateTime >= recent && !s.PlayedForUserIds.Contains(user.Id));
            var updatedSongRequest = default(SongRequest);
            if (validSongRequest != null)
            {
                updatedSongRequest = await AddUserToSongRequestPlayedList(validSongRequest, user.Id);
            }

            // We've got a valid song request. Verify the user hasn't disliked this song.
            if (updatedSongRequest != null)
            {
                var userDislikesSong = await this.DbSession
                    .Query<Like>()
                    .Where(l => l.UserId == user.Id && l.Status == LikeStatus.Dislike && l.SongId == updatedSongRequest.SongId)
                    .AnyAsync();
                if (!userDislikesSong)
                {
                    return updatedSongRequest.SongId;
                }
            }

            return null;
        }

        [HttpPost]
        [Route("requestsong")]
        public async Task RequestSong(string songId)
        {
            var user = await this.GetCurrentUser();
            var song = await this.DbSession.LoadAsync<Song>(songId);
            if (song != null && user != null)
            {
                var requestExpiration = DateTime.UtcNow.AddDays(10);
                var hasSongBeenRecentlyRequested = await this.HasSongBeenRequestedRecently(songId);
                var hasManyRequestForArtist = await this.HasManyPendingSongRequestForArtist(song.Artist);
                var hasManySongRequestsFromUser = await this.HasManyRecentSongRequestsFromUser(user.Id);
                var isPoorlyRated = song.CommunityRankStanding == CommunityRankStanding.VeryPoor;
                if (!hasSongBeenRecentlyRequested && !hasManyRequestForArtist && !hasManySongRequestsFromUser && !isPoorlyRated)
                {
                    user.TotalSongRequests++;
                    var songRequest = new SongRequest
                    {
                        DateTime = DateTime.Now,
                        PlayedForUserIds = new List<string> { user.Id },
                        SongId = songId,
                        Artist = song.Artist,
                        Name = song.Name,
                        UserId = user.Id
                    };
                    await this.DbSession.StoreAsync(songRequest);
                    this.DbSession.SetRavenExpiration(songRequest, requestExpiration);

                    // Store an activity for the song request.
                    var activity = new Activity
                    {
                        DateTime = DateTime.Now,
                        Title = string.Format("{0} - {1} was requested by one of our listeners", song.Artist, song.Name),
                        Description = string.Format("\"{0}\" by {1} was requested by one of our listeners on Chavah Messianic Radio.", song.Name, song.Artist),
                        MoreInfoUri = song.GetSongShareLink()
                    };
                    await this.DbSession.StoreAsync(activity);
                    this.DbSession.SetRavenExpiration(activity, requestExpiration);
                }
            }
        }

        private async Task<bool> HasSongBeenRequestedRecently(string songId)
        {
            var recent = DateTime.Now.Subtract(TimeSpan.FromMinutes(120));
            return await this.DbSession
                .Query<SongRequest>()
                .AnyAsync(s => s.SongId == songId && s.DateTime >= recent);
        }

        private async Task<bool> HasManyPendingSongRequestForArtist(string artist)
        {
            var recent = DateTime.Now.Subtract(TimeSpan.FromMinutes(30));
            var many = 1;
            return await this.DbSession
                .Query<SongRequest>()
                .CountAsync(s => s.Artist == artist && s.DateTime >= recent) >= many;
        }

        private async Task<bool> HasManyRecentSongRequestsFromUser(string userId)
        {
            var recent = DateTime.Now.Subtract(TimeSpan.FromMinutes(30));
            const int maxInHalfHour = 2;
            var recentSongRequestsFromUser = await this.DbSession
                .Query<SongRequest>()
                .CountAsync(s => s.UserId == userId && s.DateTime >= recent);
            return recentSongRequestsFromUser >= maxInHalfHour;
        }

        private async Task<SongRequest> AddUserToSongRequestPlayedList(SongRequest req, string userId)
        {
            req.PlayedForUserIds.Add(userId);
            try
            {
                await this.DbSession.SaveChangesAsync();
                return req;
            }
            catch (Raven.Abstractions.Exceptions.ConcurrencyException)
            {
                // We get this error often as this song request will get updated frequently in a brief period of time.
                // In such a case, try loading it directly from storage, rather than queried from index.
                DbSession.Advanced.Evict(req);
                var refreshedSongRequest = await DbSession.LoadAsync<SongRequest>(req.Id);
                if (refreshedSongRequest != null && !refreshedSongRequest.PlayedForUserIds.Contains(userId))
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
