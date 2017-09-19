using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Controllers.Api
{
    [Route("api/logs")]
    [Authorize(Roles = "Admin")]
    public class LogsController : RavenApiController
    {
        private readonly ILogger<LogsController> logger;

        public LogsController(ILogger<LogsController> logger)
        {
            this.logger = logger;
        }

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