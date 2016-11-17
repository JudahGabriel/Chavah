using BitShuva.Common;
using BitShuva.Controllers;
////using NLog;
////using NLog.Config;
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

            //// Direct NLog to store logs in Raven.
            ////var loggingConfig = new LoggingConfiguration();
            ////var ravenNLogTarget = new RavenNLogTarget(Db);
            ////loggingConfig.AddTarget("RavenNLog", ravenNLogTarget);
            ////loggingConfig.LoggingRules.Add(new LoggingRule("*", LogLevel.Trace, ravenNLogTarget));
            ////LogManager.Configuration = loggingConfig;

            IndexCreation.CreateIndexes(typeof(RavenContext).Assembly, Db);
        }
    }
}