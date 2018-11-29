using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Optional;
using Optional.Async;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    [Authorize]
    public class SongEditsController : RavenController
    {
        public SongEditsController(IAsyncDocumentSession dbSession, ILogger<SongEditsController> logger)
            : base(dbSession, logger)
        {
        }

        /// <summary>
        /// Gets a song edit for the current user. If the user hasn't edited this song before, a new one will be created.
        /// </summary>
        /// <param name="songId"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<SongEdit> Get(string songId)
        {
            var user = await this.GetUserOrThrow();
            var song = await DbSession.LoadRequiredAsync<Song>(songId);
            var songEditId = GetSongEditId(songId, user.Id);
            var existingEdit = await DbSession.LoadOptionAsync<SongEdit>(songEditId);

            // If the existing edit is pending, return that. 
            // Otherwise, return a fresh song edit.
            return existingEdit
                .Filter(e => e.Status == SongEditStatus.Pending)
                .ValueOr(() => new SongEdit(song, song));
        }
        
        [HttpPost]
        public async Task<SongEdit> EditSong([FromBody] Song song)
        {
            var user = await this.GetUserOrThrow();
            var existingSong = await this.DbSession.LoadRequiredAsync<Song>(song.Id);

            var songEditId = GetSongEditId(existingSong.Id, user.Id);
            var songEdit = new SongEdit(existingSong, song)
            {
                Id = songEditId,
                UserId = user.Id
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
                    admins.ForEach(a => a.AddNotification(Notification.SongEditsNeedApproval()));
                }
            }

            return songEdit;
        }
        
        [HttpGet]
        [Authorize(Roles = AppUser.AdminRole)]
        public Task<List<SongEdit>> GetPendingEdits(int take = 20)
        {
            return this.DbSession.Query<SongEdit>()
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
                logger.LogInformation("Applied song edit", songEdit);

                // Notify the user.
                var user = await DbSession.LoadAsync<AppUser>(songEdit.UserId);
                if (user != null)
                {
                    user.AddNotification(Notification.SongEditApproved(song));
                }
            }

            return songEdit;
        }
        
        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<SongEdit> Reject(string songEditId)
        {
            var existingEdit = await DbSession.LoadAsync<SongEdit>(songEditId);
            if (existingEdit != null)
            {
                existingEdit.Status = SongEditStatus.Rejected;
            }

            return existingEdit;
        }

        private static string GetSongEditId(string songId, string userId)
        {
            return $"SongEdits/{songId}/{userId}";
        }
    }
}