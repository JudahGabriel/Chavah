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
                        var env = hostingContext.HostingEnvironment;
                        configBuilder.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                                     .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true, reloadOnChange: true);
                        if (env.IsDevelopment())
                        {
                            configBuilder.AddUserSecrets<Startup>(optional: true);
                        }
                        //var configuration = configBuilder.AddAzureKeyVault(hostingEnviromentName: env.EnvironmentName, usePrefix: true);
                    })
                    .UseStartup<Startup>();
                });
        }
    }
}
