using BitShuva.Models;
using BitShuva.Models.Indexes;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/test")]
    public class TestController : ApiController
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
        public async Task<IHttpActionResult> Get()
        {
            // This queries the Songs_RankStandings index, which will reduce the results.
            var songRankStandings = await session
                .Query<Song, Songs_RankStandings>()
                .As<Songs_RankStandings.Results>()
                .ToListAsync();

            return Ok(songRankStandings);
        }

        [Authorize]
        [Route("User")]
        [HttpGet]
        public async Task<IHttpActionResult> GetUserInfo()
        {
            var user = await session.LoadAsync<ApplicationUser>("ApplicationUsers/" + this.User.Identity.Name);

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