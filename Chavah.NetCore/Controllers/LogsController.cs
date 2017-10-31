using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client;
using RavenDB.StructuredLog;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/logs")]
    [Authorize(Roles = "Admin")]
    public class LogsController : RavenController
    {
        public LogsController(IAsyncDocumentSession dbSession, ILogger<LogsController> logger)
            : base(dbSession, logger)
        {
        }

        [HttpGet]
        [Route("getAll")]
        public async Task<PagedList<StructuredLog>> GetAll(int skip, int take)
        {
            var results = await DbSession.Query<StructuredLog>()
                .Statistics(out var stats)
                .OrderByDescending(l => l.LastOccurrence)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedList<StructuredLog>
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

            var log = await DbSession.LoadNotNullAsync<StructuredLog>(id);
            DbSession.Delete(log);
        }
    }
}