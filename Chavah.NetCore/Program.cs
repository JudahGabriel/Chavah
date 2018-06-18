using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography.X509Certificates;
using System.Net;

namespace BitShuva.Chavah
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

            if (env == "Development")
            {
                var cert = GetCertificate();
                CreateWebHostBuilder(args, cert)
                    .Build()
                    .Run();
            }
            else
            {
                CreateWebHostBuilder(args)
                    .Build()
                    .Run();
            }

            //CreateWebHostBuilder(args).Build().Run();

        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args,
                                    X509Certificate2 certificate) =>
           WebHost.CreateDefaultBuilder(args)
               .UseStartup<Startup>()
               .UseKestrel(options =>
               {
                   options.Listen(IPAddress.Any, 443, listenOptions =>
                   {
                       listenOptions.UseHttps(certificate);
                   });
               })
                .UseUrls("https:*:443");

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>();

        /// <summary>
        /// Returns the certificate based on the environment variable setting
        /// </summary>
        /// <returns></returns>
        public static X509Certificate2 GetCertificate()
        {
            X509Certificate2 cert = null;
            try
            {
                var exePath = Directory.GetCurrentDirectory();

                var config = new ConfigurationBuilder()
                  .SetBasePath(exePath)
                  .AddEnvironmentVariables()
                  .AddJsonFile("certificate.json", optional: true, reloadOnChange: true)
                  .AddJsonFile($"certificate.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}.json", optional: true, reloadOnChange: true)
                  .Build();

                var certificateSettings = config.GetSection("certificateSettings");
                string certificateFileName = certificateSettings.GetValue<string>("filename");
                string certificatePassword = certificateSettings.GetValue<string>("password");

                var certPath = Path.GetFullPath(exePath + certificateFileName);
                return new X509Certificate2(certPath, certificatePassword);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return cert;
            }

        }

    }
}
