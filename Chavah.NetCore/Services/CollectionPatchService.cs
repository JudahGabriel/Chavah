using Raven.Client;
using Raven.Client.Documents;
using Raven.Client.Documents.Operations;
using Raven.Client.Documents.Queries;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Chavah.Services
{
    public class CollectionPatchService
    {
        private readonly IDocumentStore db;

        public CollectionPatchService(IDocumentStore db, Type collection, string script, Dictionary<string, object> variables = null)
            : this(db, db.Conventions.GetCollectionName(collection), script, variables)
        {
        }

        public CollectionPatchService(IDocumentStore db, string collection, string script, Dictionary<string, object> variables = null)
        {
            this.db = db;
            this.Collection = collection;
            this.Script = script;
            this.Variables = variables;
        }

        public string Collection { get; private set; }
        public string Script { get; private set; }
        public Dictionary<string, object> Variables { get; private set; }

        public void Execute(TimeSpan timeout)
        {
            var operation = RunPatch();
            operation.WaitForCompletion(timeout);
        }

        public async Task ExecuteAsync()
        {
            var operation = RunPatch();
            await operation.WaitForCompletionAsync();
        }

        public void ExecuteFireAndForget()
        {
            RunPatch();
        }
        
        private Operation RunPatch()
        {
            // Patch is in RQL. Example: "from AppUsers update { this.Foo = 123; }"

            var patchScript = new StringBuilder();
            if (this.Variables != null && this.Variables.Count > 0)
            {
                foreach (var variable in this.Variables)
                {
                    var variableValue = variable.Value?.ToString();
                    var escapedVariableValue = variableValue?.Replace("\"", "\\\"");
                    var escapedWithQuotes = variable.Value is string ? "\"" + escapedVariableValue + "\"" : escapedVariableValue;
                    patchScript.AppendLine($"var {variable.Key} = {escapedWithQuotes};");
                }
            }

            patchScript.AppendLine($"from {this.Collection}");
            patchScript.AppendLine("update {");
            patchScript.AppendLine(this.Script);
            patchScript.AppendLine("}");
            var patch = new PatchByQueryOperation(patchScript.ToString());
            return db.Operations.Send(patch);
        }
    }
}