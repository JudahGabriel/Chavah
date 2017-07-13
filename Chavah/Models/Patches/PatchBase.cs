using BitShuva.Interfaces;
using Raven.Abstractions.Data;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models.Patches
{
    public abstract class PatchBase
    {
        public int Number { get; set; }
        public string Script { get; set; }
        public string Collection { get; set; }
        public ILoggerService Log { get; set; }

        public void Execute()
        {
            try
            {
                BeforePatch(RavenContext.Db);

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
                    var patchOperation = RavenContext.Db.DatabaseCommands.UpdateByIndex("Raven/DocumentsByEntityName", query, patch, options);
                    patchOperation.WaitForCompletion();
                }

                AfterPatchComplete(RavenContext.Db);
            }
            catch (Exception error)
            {
                this.Log?.Error($"Error executing patch {this.GetType().Name}.", error.ToString());
                throw;
            }
        }

        protected virtual void BeforePatch(IDocumentStore db)
        {

        }

        protected virtual void AfterPatchComplete(IDocumentStore db)
        {

        }
    }
}