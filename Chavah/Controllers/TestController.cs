using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/test")]
    public class TestController : Controller
    {
        private readonly IAsyncDocumentSession session;
        private readonly IActionDescriptorCollectionProvider provider;

        public TestController(IAsyncDocumentSession session,
                              IActionDescriptorCollectionProvider provider)
        {
            this.session = session;
            this.provider = provider;
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
            var user = await session.LoadAsync<AppUser>($"AppUsers/{User.Identity?.Name}");

            return Ok(user);
        }

        [HttpGet("routes")]
        public IActionResult GetRoutes()
        {
            var routes = provider.ActionDescriptors.Items.Select(x => new {
                Action = x?.RouteValues["Action"],
                Controller = x?.RouteValues["Controller"],
                x?.AttributeRouteInfo?.Name,
                x?.AttributeRouteInfo?.Template,
                Verb = x?.ActionConstraints
            }).ToList();
            return Ok(routes);
        }
    }
}
