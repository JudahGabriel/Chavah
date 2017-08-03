using BitShuva.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Raven.Client;
using Optional;
using BitShuva.Common;

namespace BitShuva.Controllers.Api
{
    [RoutePrefix("api/logs")]
    [Authorize(Roles = "Admin")]
    public class LogsController : RavenApiController
    {
        [HttpGet]
        [Route("getAll")]
        public async Task<PagedList<LogSummary>> GetAll(int skip, int take)
        {
            var results = await DbSession.Query<LogSummary>()
                .Statistics(out var stats)
                .OrderByDescending(l => l.LastOccurrence)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedList<LogSummary>
            {
                Items = results,
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        [HttpPost]
        [Route("delete")]
        public async Task Delete(string id)
        {
            if (!id.StartsWith("LogSummary/", StringComparison.InvariantCultureIgnoreCase))
            {
                throw new ArgumentException("ID must specify a LogSummary");
            }

            var log = await DbSession.LoadNotNullAsync<LogSummary>(id);
            DbSession.Delete(log);
        }
    }
}