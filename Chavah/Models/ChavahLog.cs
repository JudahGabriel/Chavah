using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using BitShuva.Common;

namespace BitShuva.Models
{
    public class ChavahLog
    {
        public string Id { get; set; }
        public string Message { get; set; }
        public string Exception { get; set; }
        public DateTime DateTime { get; set; } = DateTime.UtcNow;
        public string Level { get; set; }
        public object Details { get; set; }

        public static async Task<ChavahLog> Error(IAsyncDocumentSession session, string message, string exception, object details = null)
        {
            var log = new ChavahLog
            {
                DateTime = DateTime.UtcNow,
                Exception = exception,
                Message = message,
                Level = "Error",
                Details = details
            };
            await session.StoreAsync(log);
            session.AddRavenExpiration(log, DateTime.UtcNow.AddDays(60));
            return log;
        }

        public static async Task<ChavahLog> Warn(IAsyncDocumentSession session, string message, object details = null)
        {
            var log = new ChavahLog
            {
                DateTime = DateTime.UtcNow,
                Exception = null,
                Message = message,
                Level = "Warn",
                Details = details
            };
            await session.StoreAsync(log);
            session.AddRavenExpiration(log, DateTime.UtcNow.AddDays(60));
            return log;
        }
    }
}