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

namespace BitShuva.Controllers
{
    [Route("api/songEdits")]
    //[JwtSession]
    public class SongEditsController : RavenApiController
    {
        private ILogger<SongEditsController> logger;

        public SongEditsController(ILogger<SongEditsController> logger)
        {
            this.logger = logger;
        }

        [Route("Edit")]
        [HttpPost]
        public async Task<SongEdit> EditSong(Song song)
        {
            var user = await this.GetCurrentUser();
            if (user == null)
            {
                throw new UnauthorizedAccessException();
            }

            var existingSong = await this.DbSession.LoadNotNullAsync<Song>(song.Id);
            var songEdit = new SongEdit(existingSong, song)
            {
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

                    // Notify admins that a new song edit needs approval.
                    var admins = await DbSession.Query<AppUser>()
                        .Where(u => u.Roles.Contains(AppUser.AdminRole))
                        .ToListAsync();
                    admins.ForEach(a => a.AddNotification(Notification.SongEditsNeedApproval()));
                }
            }

            return songEdit;
        }

        [Route("GetPendingEdits")]
        [HttpGet]
        public Task<IList<SongEdit>> GetPendingEdits(int take = 20)
        {
            return this.DbSession.Query<SongEdit>()
                .Where(s => s.Status == SongEditStatus.Pending)
                .OrderByDescending(s => s.SubmitDate)
                .Take(take)
                .ToListAsync();
        }

        [Route("Approve")]
        [HttpPost]
        public async Task<SongEdit> Approve(SongEdit songEdit)
        {
            await this.RequireAdminUser();

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

        [Route("Reject")]
        [HttpPost]
        public async Task<SongEdit> Reject(string songEditId)
        {
            await this.RequireAdminUser();

            var existingEdit = await DbSession.LoadAsync<SongEdit>(songEditId);
            if (existingEdit != null)
            {
                existingEdit.Status = SongEditStatus.Rejected;
            }

            return existingEdit;
        }
    }
}