using Microsoft.Extensions.DependencyInjection;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Transformers
{
    public static class TransformerExtensions
    {
        public static void InstallTransformers(this IServiceCollection services)
        {
            var db = services.BuildServiceProvider().GetRequiredService<IDocumentStore>();
            new SongNameTransformer().Execute(db);
        }
    }
}
