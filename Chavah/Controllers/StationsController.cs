using BitShuva.Common;
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
    [RoutePrefix("api/stations")]
    public class StationsController : UserContextController
    {
        [Route("get")]
        public async Task<IEnumerable<Station>> GetStations()
        {
            var user = await this.GetLoggedInUserOrNull();
            if (user != null)
            {
                return await this.Session
                    .Query<Station>()
                    .Where(s => s.OwnerId == user.Id)
                    .ToListAsync();
            }

            return new Station[0];
        }

        [Route("{stationId}/song")]
        public async Task<Song> GetSong(string stationId)
        {
            var station = await this.Session.LoadAsync<Station>(stationId);
            var seed = station.PickRandomSeed();
            var songsController = new SongsController() { Request = this.Request };
            var seedType = seed.Item1;

            // TODO: implement station.GetSong();
            return null;
        }

        [Authorize]
        [HttpPut]
        [Route("create")]
        public async Task<Station> Create(Station station)
        {
            var user = await this.GetLoggedInUserOrNull();
            station.OwnerId = user.Id;
            await this.Session.StoreAsync(station);
            await this.Session.SaveChangesAsync();
            return station;
        }
    }
}