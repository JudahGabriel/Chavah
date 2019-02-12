using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Raven.Client.Documents;
using Raven.Client.ServerWide.Operations;
using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.Extensions.HealthChecks
{
    public class RavenDdHealthCheck : IHealthCheck
    {
        private readonly DbConnection _options;
        private readonly IHostingEnvironment _hostingEnvironment;

        public RavenDdHealthCheck(DbConnection options, IHostingEnvironment hostingEnvironment)
        {
            _options = options ?? throw new ArgumentNullException(nameof(options));
            _hostingEnvironment = hostingEnvironment ?? throw new ArgumentException(nameof(hostingEnvironment));
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            try
            {
                using (var store = new DocumentStore
                {
                    Urls = new[] { _options.Url },
                    Database = _options.DatabaseName
                })
                {
                    if (!string.IsNullOrWhiteSpace(_options.CertFileName))
                    {
                        var certFilePath = Path.Combine(_hostingEnvironment.ContentRootPath, _options.CertFileName);
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
                        return HealthCheckResult.Healthy();
                    }
                }
            }
            catch (Exception ex)
            {
                return new HealthCheckResult(context.Registration.FailureStatus, exception: ex);
            }
        }
    }
}
