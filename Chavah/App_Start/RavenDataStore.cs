using BitShuva.Models;
using BitShuva.Models.Patches;
using BitShuva.Models.Transformers;
using BitShuva.Services;
using Optional;
using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva
{
    public static class RavenContext
    {
        public static IDocumentStore Db { get; private set; }

        public static void Initialize()
        {
            var docStore = new DocumentStore { ConnectionStringName = "RavenDB" };
            docStore.Initialize();
            Db = docStore;
            
            // Install all our indexes.
            IndexCreation.CreateIndexes(typeof(RavenContext).Assembly, Db);

            // Install our transformers.
            new SongNameTransformer().Execute(Db);

            RunPendingPatches();
        }

        public static void RunPendingPatches()
        {
            // Find out what schema version our entities are in and run any patches accordingly.
            using (var session = Db.OpenSession())
            {
                const string schemaDocId = "DatabaseSchemaVersions/1";
                var schemaVersion = session.Load<DatabaseSchemaVersion>(schemaDocId)
                    .SomeNotNull()
                    .Match(
                        some: s => s,
                        none: () =>
                        {
                            var newSchemaDoc = new DatabaseSchemaVersion();
                            session.Store(newSchemaDoc, schemaDocId);
                            return newSchemaDoc;
                        }
                    );

                // Find all patches in the assembly with a version later than our database schema version.
                var newPatches = typeof(RavenContext).Assembly.GetTypes()
                    .Where(t => typeof(PatchBase).IsAssignableFrom(t) && t != typeof(PatchBase))
                    .Select(t => (PatchBase)Activator.CreateInstance(t))
                    .Where(p => p.Number > schemaVersion.Number)
                    .OrderBy(t => t.Number)
                    .ToList();

                foreach (var patch in newPatches)
                {
                    patch.Log = new LoggerService();
                    patch.Execute();
                    schemaVersion.Number = patch.Number;

                    // Save changes after each successful patch. Otherwise we'd run into situations where
                    // the first patch succeeds, but the 2nd patch fails. On next run, the first patch would
                    // be run again, which would result in doubly-patched data.
                    session.SaveChanges();
                }
            }
        }
    }
}