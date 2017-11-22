using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BitShuva.Chavah
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Zanz main 1");
            BuildWebHost(args).Run();
            Console.WriteLine("Zanz main 2");
        }

        public static IWebHost BuildWebHost(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>()
                .Build();
    }
}
