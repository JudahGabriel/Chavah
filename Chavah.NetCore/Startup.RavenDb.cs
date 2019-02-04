using System.IO;
using System.Security.Cryptography.X509Certificates;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using Raven.Client.Documents;

namespace Microsoft.Extensions.DependencyInjection
{
    /// <summary>
    /// Adds a Raven document store to the dependency injection services.
    /// </summary>
    public static class DocumentStoreExtensions
    {
        /// <summary>
        /// Adds a Raven <see cref="IDocumentStore"/> singleton to the dependency injection services.
        /// </summary>
        /// <param name="services"></param>
        /// <returns></returns>
        public static IServiceCollection AddRavenDocStore(this IServiceCollection services)
        {
            var provider = services.BuildServiceProvider();
            var host = provider.GetRequiredService<IHostingEnvironment>();

            var settings = provider.GetRequiredService<IOptions<AppSettings>>().Value.DbConnection;
            var docStore = new DocumentStore
            {
                Urls = new[] { settings.Url },
                Database = settings.DatabaseName
            };

            // Configure the certificate if we have one in app settings.
            if (!string.IsNullOrEmpty(settings.CertFileName))
            {
                var certFilePath = Path.Combine(host.ContentRootPath, settings.CertFileName);
                docStore.Certificate = new X509Certificate2(certFilePath, settings.CertPassword);
            }

            docStore.Initialize();
            services.AddSingleton<IDocumentStore>(docStore);

            return services;
        }
    }
}
