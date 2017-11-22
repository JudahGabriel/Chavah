using Microsoft.Extensions.DependencyInjection;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Indexes
{
    public static class IndexExtensions
    {
        public static void InstallIndexes(this IServiceCollection services)
        {
            var db = services.BuildServiceProvider().GetRequiredService<IDocumentStore>();
            Raven.Client.Indexes.IndexCreation.CreateIndexes(typeof(Startup).Assembly, db);
        }
    }
}
