using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using Raven.Client.ServerWide.Operations;
using Raven.DependencyInjection;

namespace Microsoft.Extensions.HealthChecks
{
    /// <summary>
    /// HealthCheck for RavenDb
    /// </summary>
    public class RavenDbHealthCheck : IHealthCheck
    {
        private readonly RavenOptions _options;

        public RavenDbHealthCheck(IOptions<RavenOptions> options)
        {
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
