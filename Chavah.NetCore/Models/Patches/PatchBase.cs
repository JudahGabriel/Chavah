using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Raven.Abstractions.Data;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models.Patches
{
    public abstract class PatchBase
    {
        public int Number { get; set; }
        public string Script { get; set; }
        public string Collection { get; set; }

        public void Execute(IDocumentStore db)
        {
            BeforePatch(db);

            if (!string.IsNullOrEmpty(this.Collection) && !string.IsNullOrEmpty(this.Script))
            {
                var patch = new ScriptedPatchRequest
                {
                    Script = this.Script
                };
                var query = new IndexQuery
                {
                    Query = $"Tag:{Collection}"
                };
                var options = new BulkOperationOptions
                {
                    AllowStale = true
                };
                var patchOperation = db.DatabaseCommands.UpdateByIndex("Raven/DocumentsByEntityName", query, patch, options);
                patchOperation.WaitForCompletion();
            }

            AfterPatchComplete(db);
        }

        protected virtual void BeforePatch(IDocumentStore db)
        {

        }

        protected virtual void AfterPatchComplete(IDocumentStore db)
        {

        }

        protected List<T> Stream<T>(IDocumentStore db, Func<T, bool> filter)
        {
            var entityName = db.Conventions.GetTypeTagName(typeof(T));
            var items = new List<T>(500);
            using (var session = db.OpenSession())
            {
                using (var enumerator = session.Advanced.Stream<T>(entityName))
                {
                    while (enumerator.MoveNext())
                    {
                        if (filter(enumerator.Current.Document))
                        {
                            items.Add(enumerator.Current.Document);
                        }
                    }
                }
            }

            return items;
        }

        public static void RunPendingPatches(IServiceCollection appServices)
        {
            var serviceProvider = appServices.BuildServiceProvider();
            var db = serviceProvider.GetRequiredService<IDocumentStore>();
            var logger = serviceProvider.GetRequiredService<ILogger<PatchBase>>();

            // Find out what schema version our entities are in and run any patches accordingly.
            using (var session = db.OpenSession())
            {
                // See what scheme the database is at.
                var schemaDoc = session.Load<DatabaseSchemaVersion>("DatabaseSchemaVersions/1");

                // No schema? Start from the beginning and store a scheme doc.
                if (schemaDoc == null)
                {
                    schemaDoc = new DatabaseSchemaVersion();
                    session.Store(schemaDoc);
                }

                // Find all patches in the assembly with a version later than our database schema version.
                var newPatches = typeof(PatchBase).Assembly.GetTypes()
                    .Where(t => typeof(PatchBase).IsAssignableFrom(t) && t != typeof(PatchBase)) // Find derivatives of the PatchBase class
                    .Select(t => (PatchBase)Activator.CreateInstance(t)) // Create an instance
                    .Where(p => p.Number > schemaDoc.Number) // Is the patch number > database scheme version?
                    .OrderBy(t => t.Number); // Order them by least to greatest

                foreach (var patch in newPatches)
                {
                    patch.Execute(db);
                    schemaDoc.Number = patch.Number;

                    // Save changes after each successful patch. Otherwise we'd run into situations where
                    // the first patch succeeds, but the 2nd patch fails. On next run, the first patch would
                    // be run again, which would result in doubly-patched data.
                    session.SaveChanges();
                }
            }
        }
    }
}