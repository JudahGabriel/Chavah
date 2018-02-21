using BitShuva.Chavah.Common;
using Raven.Client.Documents;
using Raven.Client.Documents.Queries;
using System;
using System.Collections.Generic;

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
                var indexQuery = new IndexQuery
                {
                    Query = this.Script
                };

                var patch = db.PatchAll(this.Collection, this.Script);
                try
                {
                    patch.WaitForCompletion(TimeSpan.FromMinutes(3));
                }
                catch (Exception error)
                {
                    Console.WriteLine("Patch didn't complete within the alloted time. " + error.Message);
                }
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
            var entityName = db.Conventions.GetCollectionName(typeof(T));
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
    }
}