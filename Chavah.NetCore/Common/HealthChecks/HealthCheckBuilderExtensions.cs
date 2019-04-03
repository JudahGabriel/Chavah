using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.HealthChecks;
using Microsoft.Extensions.Options;
using Raven.DependencyInjection;
using System.Collections.Generic;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class HealthCheckBuilderExtensions
    {
        /// <summary>
        /// Add a HealthCheck for RavenDb.
        /// </summary>
        /// <param name="builder">The <see cref="IHealthChecksBuilder"/>.</param>
        /// <param name="name">The name of the HealthCheck.</param>
        /// <param name="failureStatus">The <see cref="HealthStatus"/>The type should be reported when the health check fails. Optional. If <see langword="null"/> then</param>
        /// <param name="tags">A list of tags that can be used to filter sets of health checks. Optional.</param>
        /// <returns></returns>
        public static IHealthChecksBuilder AddRavenDbCheck(
            this IHealthChecksBuilder builder,
            string name = "ravendb",
            HealthStatus? failureStatus = default,
            IEnumerable<string> tags = default)
        {
            builder.Add(new HealthCheckRegistration(
                name,
                sp => {
                    var options = sp.GetRequiredService<IOptions<RavenOptions>>();
                    var hostingEnviroment = sp.GetRequiredService<IHostingEnvironment>();
                    return new RavenDbHealthCheck(options, hostingEnviroment);
                 },

                failureStatus,
                tags));

            return builder;
        }
    }
}
