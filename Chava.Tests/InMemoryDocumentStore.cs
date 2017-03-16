using BitShuva.Models.Indexes;
using Raven.Client.Embedded;

namespace Chava.Tests
{
    public class InMemoryDocumentStore
    {
        public EmbeddableDocumentStore Store { get; private set; }

        public InMemoryDocumentStore()
        {
            var documentStore = new EmbeddableDocumentStore
            {
                Configuration =
                    {
                        RunInUnreliableYetFastModeThatIsNotSuitableForProduction = true,
                        RunInMemory = true
                      }
            };

            documentStore.Initialize();

            //custom indexes go here
            CreatIndexes(documentStore);
            
            Store = documentStore;
        }

        public void CreatIndexes(EmbeddableDocumentStore store)
        {   
            var songs_RankStandings = new Songs_RankStandings();
            songs_RankStandings.Execute(store);
        }
    }
}
