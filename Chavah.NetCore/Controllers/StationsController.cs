using BitShuva.Chavah.Models;
using BitShuva.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Raven.Client;
using Raven.Client.Linq;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Controllers
{
    //[JwtSession]
    [Route("api/stations")]
    public class StationsController : RavenApiController
    {
        private ILoggerService _logger;

        public StationsController(ILoggerService logger)
        {
            _logger = logger;
        }
        [Route("get")]
        public async Task<IEnumerable<Station>> GetStations()
        {
            var user = await this.GetCurrentUser();
            if (user != null)
            {
                return await this.DbSession
                    .Query<Station>()
                    .Where(s => s.OwnerId == user.Id)
                    .ToListAsync();
            }

            return new Station[0];
        }

        [Route("{stationId}/song")]
        public async Task<Song> GetSong(string stationId)
        {
            var station = await this.DbSession.LoadAsync<Station>(stationId);
            var seed = station.PickRandomSeed();
            var songsController = new SongsController(_logger) { Request = this.Request };
            var seedType = seed.Item1;

            // TODO: implement station.GetSong();
            return null;
        }
        
        [HttpPut]
        [Route("create")]
        public async Task<Station> Create(Station station)
        {
            var user = await this.GetCurrentUser();
            station.OwnerId = user.Id;
            await this.DbSession.StoreAsync(station);
            await this.DbSession.SaveChangesAsync();
            return station;
        }
    }
}