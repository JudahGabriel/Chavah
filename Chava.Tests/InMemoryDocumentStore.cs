using BitShuva.Models.Indexes;
using Raven.Client.Embedded;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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


            //custom index
            var songs_RankStandings = new Songs_RankStandings();
            songs_RankStandings.Execute(documentStore);

            Store = documentStore;
        }

       
    }
}
