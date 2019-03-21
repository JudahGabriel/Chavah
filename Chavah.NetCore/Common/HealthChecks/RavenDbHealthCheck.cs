using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
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
        private readonly RavenSettings _options;
        private readonly IHostingEnvironment _hostingEnvironment;

        public RavenDbHealthCheck(RavenSettings options, IHostingEnvironment hostingEnvironment)
        {
            _options = options ?? throw new ArgumentNullException(nameof(options));
            _hostingEnvironment = hostingEnvironment ?? throw new ArgumentException(nameof(hostingEnvironment));
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                using (var store = new DocumentStore
                {
                    Urls = _options.Urls,
                    Database = _options.DatabaseName
                })
                {
                    if (!string.IsNullOrWhiteSpace(_options.CertFilePath))
                    {
                        var certFilePath = Path.Combine(_hostingEnvironment.ContentRootPath, _options.CertFilePath);
                        store.Certificate = new X509Certificate2(certFilePath, _options.CertPassword);
                    }

                    store.Initialize();

                    var operation = new GetDatabaseNamesOperation(start: 0, pageSize: 100);
                    var databaseNames = await store.Maintenance.Server.SendAsync(operation);

                    if (!string.IsNullOrWhiteSpace(_options.DatabaseName)
                        && !databaseNames.Contains(_options.DatabaseName, StringComparer.OrdinalIgnoreCase))
                    {
                        return new HealthCheckResult(
                            context.Registration.FailureStatus,
                            $"RavenDB doesn't contains '{_options.DatabaseName}' database.");
                    }
                    else
                    {
                        return HealthCheckResult.Healthy("ChavaDb is operational.");
                    }
                }
            }
            catch (Exception ex)
            {
                return new HealthCheckResult(context.Registration.FailureStatus, description: "ChavahDb is down", exception: ex);
            }
        }
    }
}
