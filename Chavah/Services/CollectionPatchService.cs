using Raven.Abstractions.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Services
{
    public class CollectionPatchService
    {
        public CollectionPatchService(string collection, string script, Dictionary<string, object> scriptTemplateVariables)
        {
            this.Collection = collection;
            this.Script = script;
            this.ScriptTemplateVariables = scriptTemplateVariables;
        }

        public string Collection { get; private set; }
        public string Script { get; private set; }
        public Dictionary<string, object> ScriptTemplateVariables { get; private set; }

        public async Task Execute()
        {
            var patch = new ScriptedPatchRequest
            {
                Script = this.Script,
                Values = this.ScriptTemplateVariables
            };            
            var query = new IndexQuery { Query = $"Tag:{this.Collection}" };
            var options = new BulkOperationOptions { AllowStale = true };
            var patchOperation = RavenContext.Db.DatabaseCommands.UpdateByIndex("Raven/DocumentsByEntityName", query, patch, options);
            await patchOperation.WaitForCompletionAsync();;
        }
    }
}