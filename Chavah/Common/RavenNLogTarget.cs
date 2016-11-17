////using BitShuva.Models;
////using NLog;
////using NLog.Targets;
////using Raven.Client;
////using System;
////using System.Collections.Generic;
////using System.Linq;
////using System.Web;

////namespace BitShuva.Common
////{
////    [Target("RavenNLog")]
////    public class RavenNLogTarget : TargetWithLayout
////    {
////        private readonly IDocumentStore db;
////        private IDocumentSession session;

////        public RavenNLogTarget(IDocumentStore db)
////        {
////            this.db = db;
////        }

////        protected override void Write(LogEventInfo logEvent)
////        {
////            if (logEvent.LoggerName == null || !logEvent.LoggerName.StartsWith("Raven."))
////            {
////                SendLogToRaven(logEvent);
////            }
////        }

////        private void SendLogToRaven(LogEventInfo logEvent)
////        {
////            var log = new ChavahLog
////            {
////                Message = logEvent.Message,
////                DateTime = logEvent.TimeStamp,
////                Exception = logEvent.Exception?.ToString(),
////                Level = logEvent.Level.Name
////            };

////            if (session == null)
////            {
////                session = db.OpenSession();
////            }

////            session.Store(log);
////            session.SaveChanges();
////        }

////        protected override void CloseTarget()
////        {
////            if (session != null)
////            {
////                session.Dispose();
////                session = null;
////            }

////            base.CloseTarget();
////        }

////        protected override void Dispose(bool disposing)
////        {
////            if (disposing && session != null)
////            {
////                session.Dispose();
////                session = null;
////            }

////            base.Dispose(disposing);
////        }
////    }
////}