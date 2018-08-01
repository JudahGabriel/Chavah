using BitShuva.Chavah;
using Raven.Client.Documents;
using Raven.Client.Documents.Indexes;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class IndexExtensions
    {
        public static void InstallIndexes(this IServiceCollection services)
        {
            var db = services.BuildServiceProvider().GetRequiredService<IDocumentStore>();
            IndexCreation.CreateIndexes(typeof(Startup).Assembly, db);
        }
    }
}
