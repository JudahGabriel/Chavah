using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Raven.Client.Documents;
using Raven.Client.ServerWide.Operations;
using Raven.DependencyInjection;
using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.Extensions.HealthChecks
{
    /// <summary>
    /// HealthCheck for RavenDb
    /// </summary>
    public class RavenDbHealthCheck : IHealthCheck
    {
        private readonly IHostingEnvironment _hostingEnvironment;
        private readonly RavenOptions _options;

        public RavenDbHealthCheck(
            IOptions<RavenOptions> options,
            IHostingEnvironment hostingEnvironment
)
        {
            _hostingEnvironment = hostingEnvironment ?? throw new ArgumentException(nameof(hostingEnvironment));
            _options = options.Value;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var store = _options.GetDocumentStore(null);

                var operation = new GetDatabaseNamesOperation(start: 0, pageSize: 100);
                var databaseNames = await store.Maintenance.Server.SendAsync(operation);

                if (!string.IsNullOrWhiteSpace(_options.Settings.DatabaseName)
                    && !databaseNames.Contains(_options.Settings.DatabaseName, StringComparer.OrdinalIgnoreCase))
                {
                    return new HealthCheckResult(
                        context.Registration.FailureStatus,
                        $"RavenDB doesn't contains '{_options.Settings.DatabaseName}' database.");
                }
                else
                {
                    return HealthCheckResult.Healthy("ChavaDb is operational.");
                }
            }
            catch (Exception ex)
            {
                return new HealthCheckResult(
                    context.Registration.FailureStatus,
                    description: "ChavahDb is down",
                    exception: ex);
            }
        }
    }
}
