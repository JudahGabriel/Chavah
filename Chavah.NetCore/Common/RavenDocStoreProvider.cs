using System.IO;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Raven.Client.Documents;
using Raven.Client.Documents.Smuggler;
using Raven.Client.ServerWide;
using Raven.Client.ServerWide.Operations;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// Adds a Raven document store to the dependency injection services.
    /// </summary>
    public static class RavenDocStoreProvider
    {
        /// <summary>
        /// Adds a Raven <see cref="IDocumentStore"/> singleton to the dependency injection services.
        /// </summary>
        /// <param name="services"></param>
        /// <returns></returns>
        public static IServiceCollection AddRavenDocStore(this IServiceCollection services)
        {
            var provider = services.BuildServiceProvider();

            var settings = provider.GetRequiredService<IOptions<AppSettings>>().Value.DbConnection;
            var docStore = new DocumentStore
            {
                Urls = new[] { settings.Url },
                Database = settings.DatabaseName
            };

            var host = provider.GetRequiredService<IHostingEnvironment>();

            // Configure the certificate if we have one in app settings.
            if (!string.IsNullOrEmpty(settings.CertFileName))
            {
                
                var certFilePath = Path.Combine(host.ContentRootPath, settings.CertFileName);
                docStore.Certificate = new X509Certificate2(certFilePath, settings.CertPassword);
            }

            docStore.Initialize();
            services.AddSingleton<IDocumentStore>(docStore);

            if (host.IsDevelopment())
            {
                var importFilePath = Path.Combine(host.ContentRootPath, settings.FileName);

                var operation = new GetDatabaseNamesOperation(0, 1000); // 1000 is safe enough for me.
                var databaseNames = docStore.Maintenance.Server.Send(operation);
                if (databaseNames.Any(_ => _ == docStore.Database)) return services; // database already exists!

                docStore.Maintenance.Server.Send(
                new CreateDatabaseOperation(new DatabaseRecord(settings.DatabaseName)));

                var importOperation = docStore
                                        .Smuggler
                                        .ImportAsync(
                                            new DatabaseSmugglerImportOptions
                                            {
                                                OperateOnTypes = DatabaseItemType.Documents
                                            },
                                            importFilePath,
                                            new CancellationToken()).ConfigureAwait(false).GetAwaiter().GetResult();


                importOperation.WaitForCompletionAsync().Wait();
            }

            return services;
        }
    }
}
