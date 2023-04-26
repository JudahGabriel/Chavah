using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using Raven.StructuredLog;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    [Authorize(Roles = AppUser.AdminRole)]
    public class LogsController : RavenController
    {
        public LogsController(
            IAsyncDocumentSession dbSession,
            ILogger<LogsController> logger)
            : base(dbSession, logger)
        {
        }

        [HttpGet]
        public async Task<PagedList<StructuredLog>> GetAll(int skip, int take, LogLevel? level, LogSort sort)
        {
            IQueryable<StructuredLog> query = DbSession.Query<StructuredLog>()
                .Statistics(out var stats);

            if (sort == LogSort.Newest)
            {
                query = query.OrderByDescending(l => l.LastOccurrence);
            }
            else if (sort == LogSort.Oldest)
            {
                query = query.OrderBy(l => l.FirstOccurrence);
            }
            else if (sort == LogSort.OccurrenceCount)
            {
                query = query.OrderByDescending(l => l.OccurrenceCount);
            }

            if (level.HasValue)
            {
                query = query.Where(q => q.Level == level.Value);
            }

            var logs = await query
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedList<StructuredLog>
            {
                Items = logs,
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        [HttpPost]
        public async Task Delete(string id)
        {
            var log = await DbSession.LoadRequiredAsync<StructuredLog>(id);
            DbSession.Delete(log);
            await DbSession.SaveChangesAsync();
        }
    }
}
