using BitShuva.Models;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/playlists")]
    public class PlaylistsController : UserContextController
    {
        [Route("get")]
        public async Task<IEnumerable<Playlist>> GetPlaylists()
        {
            var user = await this.GetLoggedInUserOrNull();
            if (user == null)
            {
                return new Playlist[0];
            }

            return await this.DbSession
                .Query<Playlist>()
                .Where(s => s.OwnerId == user.Id)
                .ToListAsync();
        }

        [Authorize]
        [HttpPut]
        [Route("create")]
        public async Task<Playlist> Create(Playlist playlist)
        {
            var user = await this.GetLoggedInUserOrNull();
            playlist.OwnerId = user.Id;
            await this.DbSession.StoreAsync(playlist);
            await this.DbSession.SaveChangesAsync();
            
            return playlist;
        }
    }
}