using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.HealthChecks;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
                    var options = sp.GetRequiredService<IOptions<AppSettings>>().Value.DbConnection;
                    var hostingEnviroment = sp.GetRequiredService<IHostingEnvironment>();
                    return new RavenDbHealthCheck(options, hostingEnviroment);
                 },

                failureStatus,
                tags));

            return builder;
        }

        /// <summary>
        /// Add a HealthCheck for Garbage Collection Memory check.
        /// </summary>
        /// <param name="builder">The <see cref="IHealthChecksBuilder"/>.</param>
        /// <param name="name">The name of the HealthCheck.</param>
        /// <param name="failureStatus">The <see cref="HealthStatus"/>The type should be reported when the health check fails. Optional. If <see langword="null"/> then</param>
        /// <param name="tags">A list of tags that can be used to filter sets of health checks. Optional.</param>
        /// <param name="thresholdInBytes">The Threshold in bytes. The default is 1073741824 bytes or 1Gig.</param>
        /// <returns></returns>
        public static IHealthChecksBuilder AddMemoryHealthCheck(
                    this IHealthChecksBuilder builder,
                    string name = "memory",
                    HealthStatus? failureStatus = null,
                    IEnumerable<string> tags = null,
                    long? thresholdInBytes = null)
        {
            // Register a check of type GCInfo.
            builder.AddCheck<MemoryHealthCheck>(name, failureStatus ?? HealthStatus.Degraded, tags);

            // Configure named options to pass the threshold into the check.
            if (thresholdInBytes.HasValue)
            {
                builder.Services.Configure<MemoryCheckOptions>(name, options =>
                {
                    options.Threshold = thresholdInBytes.Value;
                });
            }

            return builder;
        }

        internal static Task WriteResponse(
            HttpContext httpContext,
            HealthReport result)
        {
            httpContext.Response.ContentType = "application/json";

            var json = new JObject(
                new JProperty("status", result.Status.ToString()),
                new JProperty("results", new JObject(result.Entries.Select(pair =>
                    new JProperty(pair.Key, new JObject(
                        new JProperty("status", pair.Value.Status.ToString()),
                        new JProperty("description", pair.Value.Description),
                        new JProperty("data", new JObject(pair.Value.Data.Select(
                            p => new JProperty(p.Key, p.Value))))))))));

            return httpContext.Response.WriteAsync(
                json.ToString(Formatting.Indented));
        }
    }
}
