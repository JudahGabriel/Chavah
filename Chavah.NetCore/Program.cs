using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Raven.StructuredLog;

namespace BitShuva.Chavah
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args)
        {
            return WebHost.CreateDefaultBuilder(args)
                    // configure logging on the webhost instance
                    .ConfigureLogging((context, logger) =>
                    {
                        logger.AddDebug();
                        logger.AddConsole();
                        //logger.AddRavenStructuredLogger();
                        logger.AddConfiguration(context.Configuration.GetSection("Logging"));
                    })
                    .UseStartup<Startup>();
        }
    }
}
