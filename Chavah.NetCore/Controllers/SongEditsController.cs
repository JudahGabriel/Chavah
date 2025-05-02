using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    [Authorize]
    public class SongEditsController : RavenController
    {
        private readonly AppSettings appOptions;

        public SongEditsController(
            IAsyncDocumentSession dbSession,
            IOptionsMonitor<AppSettings> appOptions,
            ILogger<SongEditsController> logger)
            : base(dbSession, logger)
        {
            this.appOptions = appOptions.CurrentValue;
        }

        /// <summary>
        /// Gets a song edit for the current user. If the user hasn't edited this song before, a new one will be created.
        /// </summary>
        /// <param name="songId"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<SongEdit> Get(string songId)
        {
            var user = await GetUserOrThrow();
            var song = await DbSession.LoadRequiredAsync<Song>(songId);
            var songEditId = GetSongEditId(songId, user.Id!);
            var existingEdit = await DbSession.LoadOptionalAsync<SongEdit>(songEditId);

            // If the existing edit is pending, return that.
            // Otherwise, return a fresh song edit.
            if (existingEdit?.Status == SongEditStatus.Pending)
            {
                return existingEdit;
            }

            return new SongEdit(song, song);
        }

        [HttpPost]
        public async Task<SongEdit> EditSong([FromBody] Song song)
        {
            var user = await GetUserOrThrow();
            if (song.Id == null)
            {
                throw new ArgumentException("Song must have an ID");
            }

            var existingSong = await DbSession.LoadRequiredAsync<Song>(song.Id);

            var songEditId = GetSongEditId(existingSong.Id!, user.Id!);
            var songEdit = new SongEdit(existingSong, song)
            {
                Id = songEditId,
                UserId = user.Id!
            };
            if (songEdit.HasAnyChanges())
            {
                // Admins don't need approval; apply the change straight away.
                if (user.IsAdmin())
                {
                    songEdit.Apply(existingSong);
                }
                else // the user isn't an admin.
                {
                    // Store the song edit and await admin approval.
                    await DbSession.StoreAsync(songEdit);
                    DbSession.SetRavenExpiration(songEdit, DateTime.UtcNow.AddDays(30 * 6));

                    // Notify admins that a new song edit needs approval.
                    var admins = await DbSession.Query<AppUser>()
                        .Where(u => u.Roles.Contains(AppUser.AdminRole))
                        .ToListAsync();
                    var editNeedsApprovalNotification = Notification.SongEditsNeedApproval(appOptions.PushNotificationsImageUrl);
                    foreach (var admin in admins)
                    {
                        // If the admin already has a "song edits need approval" notification item, replace it with the unread one.
                        var existing = admin.Notifications.FirstOrDefault(n => n.Title == editNeedsApprovalNotification.Title);
                        if (existing != null)
                        {
                            admin.Notifications.Remove(existing);
                        }
                        
                        admin.AddNotification(editNeedsApprovalNotification);
                    }
                }
            }

            return songEdit;
        }

        [HttpGet]
        [Authorize(Roles = AppUser.AdminRole)]
        public Task<List<SongEdit>> GetPendingEdits(int take = 20)
        {
            return DbSession.Query<SongEdit>()
                .Where(s => s.Status == SongEditStatus.Pending)
                .OrderByDescending(s => s.SubmitDate)
                .Take(take)
                .ToListAsync();
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<SongEdit> Approve([FromBody] SongEdit songEdit)
        {
            var song = await DbSession.LoadAsync<Song>(songEdit.SongId);
            if (song != null)
            {
                songEdit.Apply(song);
                songEdit.Status = SongEditStatus.Approved;
                await DbSession.StoreAsync(songEdit);
                DbSession.SetRavenExpiration(songEdit, DateTime.UtcNow.AddDays(1));
                logger.LogInformation("Applied song edit {edit}", songEdit);

                // Notify the user.
                var user = await DbSession.LoadAsync<AppUser>(songEdit.UserId);
                user?.AddNotification(Notification.SongEditApproved(song));
            }

            return songEdit;
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<SongEdit?> Reject(string songEditId)
        {
            var existingEdit = await DbSession.LoadOptionalAsync<SongEdit>(songEditId);
            if (existingEdit != null)
            {
                existingEdit.Status = SongEditStatus.Rejected;
                DbSession.SetRavenExpiration(existingEdit, DateTime.UtcNow.AddDays(1));
            }

            return existingEdit;
        }

        private static string GetSongEditId(string songId, string userId)
        {
            return $"SongEdits/{songId}/{userId}";
        }
    }
}
