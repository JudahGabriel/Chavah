using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Raven.Client;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/test")]
    public class TestController : Controller
    {
        private readonly IAsyncDocumentSession session;

        public TestController(IAsyncDocumentSession session)
        {
            this.session = session;
        }

        /// <summary>
        /// https://localhost:44372/api/test
        /// </summary>
        /// <returns></returns>
        [Route("")]
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            // This queries the Songs_RankStandings index, which will reduce the results.
            var songRankStandings = await session
                .Query<Song, Songs_RankStandings>()
                .As<Songs_RankStandings.Result>()
                .ToListAsync();

            return Ok(songRankStandings);
        }

        [Authorize]
        [Route("User")]
        [HttpGet]
        public async Task<IActionResult> GetUserInfo()
        {
            var user = await session.LoadAsync<AppUser>("ApplicationUsers/" + this.User.Identity.Name);

            return Ok(user);
        }
       
        // POST api/<controller>
        public void Post([FromBody]string value)
        {
        }

        // PUT api/<controller>/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/<controller>/5
        public void Delete(int id)
        {
        }
    }
}