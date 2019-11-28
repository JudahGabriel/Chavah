using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace BitShuva.Chavah
{
#pragma warning disable RCS1102 // Make class static.
    public class Program
#pragma warning restore RCS1102 // Make class static.
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args)
        {
            return Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.ConfigureAppConfiguration((hostingContext, configBuilder) =>
                    {
                        // based on environment Development = dev; Production = prod prefix in Azure Vault.
                        var envName = hostingContext.HostingEnvironment.EnvironmentName;
                        var configuration = configBuilder.AddAzureKeyVault(hostingEnviromentName: envName, usePrefix: true);

                        // helpful to see what was retrieved from all of the configuration providers.
                        if (hostingContext.HostingEnvironment.IsDevelopment())
                        {
                            //configuration.DebugConfigurations();
                        }
                    })
                    .UseStartup<Startup>();
                });
        }
    }
}
