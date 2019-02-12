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
        /// Add a healthcheck for ravendb.
        /// </summary>
        /// <param name="builder"></param>
        /// <param name="services"></param>
        /// <param name="name"></param>
        /// <param name="failureStatus"></param>
        /// <param name="tags"></param>
        /// <returns></returns>
        public static IHealthChecksBuilder AddRavenDbCheck(
            this IHealthChecksBuilder builder,
            IServiceCollection services,
            string name = "ravendb",
            HealthStatus? failureStatus = default,
            IEnumerable<string> tags = default)
        {
            var provider = services.BuildServiceProvider();

            var options = provider.GetRequiredService<IOptions<AppSettings>>().Value.DbConnection;

            var hostingEnviroment = provider.GetRequiredService<IHostingEnvironment>();

            builder.Add(new HealthCheckRegistration(
                name,
                sp => new RavenDdHealthCheck(options, hostingEnviroment),
                failureStatus,
                tags));

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
