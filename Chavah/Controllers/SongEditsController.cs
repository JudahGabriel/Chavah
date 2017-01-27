using BitShuva.Common;
using BitShuva.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Raven.Client;
using Raven.Client.Linq;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/songEdits")]
    [JwtSession]
    public class SongEditsController : RavenApiController
    {
        [Route("Edit")]
        [HttpPost]
        public async Task<SongEdit> EditSong(Song song)
        {
            var user = await this.GetCurrentUser();
            if (user == null)
            {
                throw NewUnauthorizedException();
            }

            var existingSong = await this.DbSession.LoadAsync<Song>(song.Id);
            if (existingSong == null)
            {
                throw new InvalidOperationException("Couldn't find " + song.Id);
            }

            var songEdit = new SongEdit(existingSong, song)
            {
                UserId = user.Id
            };
            if (songEdit.HasAnyChanges())
            {
                // Is the current user an admin? If so, apply the change straight away.
                if (user.IsAdmin())
                {
                    songEdit.Apply(existingSong);
                    await ChavahLog.Info(DbSession, "Applied song edit", songEdit);
                }
                else
                {
                    await DbSession.StoreAsync(songEdit);
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