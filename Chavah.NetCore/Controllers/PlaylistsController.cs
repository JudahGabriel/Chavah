using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client;
using Raven.Client.Linq;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Controllers
{
    //[JwtSession]
    [Route("api/playlists")]
    public class PlaylistsController : RavenApiController
    {
        private readonly ILogger<PlaylistsController> logger;

        public PlaylistsController(ILogger<PlaylistsController> logger)
        {
            this.logger = logger;
        }

        [Route("get")]
        public async Task<IEnumerable<Playlist>> GetPlaylists()
        {
            var user = await this.GetCurrentUser();
            if (user == null)
            {
                return new Playlist[0];
            }

            return await this.DbSession
                .Query<Playlist>()
                .Where(s => s.OwnerId == user.Id)
                .ToListAsync();
        }
        
        [HttpPut]
        [Route("create")]
        public async Task<Playlist> Create(Playlist playlist)
        {
            var user = await this.GetCurrentUser();
            playlist.OwnerId = user.Id;
            await this.DbSession.StoreAsync(playlist);
            await this.DbSession.SaveChangesAsync();
            
            return playlist;
        }
    }
}