using BitShuva.Controllers;
using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva
{
    public static class RavenDataStore
    {
        public static IDocumentStore Store
        {
            get;
            private set;
        }

        public static void Initialize()
        {
            var docStore = new DocumentStore { ConnectionStringName = "RavenDB" };

            try
            {
                docStore.Initialize();
            }
            catch (System.TimeoutException)
            {
                // Raven is just booting up (possibly after a system restart). Pause for 30 seconds, then try again.
                System.Threading.Thread.Sleep(30000);
                docStore.Initialize();
            }

            IndexCreation.CreateIndexes(typeof(RavenDataStore).Assembly, docStore);
            Store = docStore;
        }
    }
}