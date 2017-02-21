using Raven.Client;
using System;
using System.Threading.Tasks;
using BitShuva.Common;

namespace BitShuva.Models
{
    public class ChavahLog
    {
        public string Id { get; set; }
        public string Message { get; set; }
        public string Exception { get; set; }
        public DateTime DateTime { get; set; } = DateTime.UtcNow;
        public LogLevel Level { get; set; }
        public object Details { get; set; }

        public static Task<ChavahLog> Error(IAsyncDocumentSession session, string message, string exception, object details = null)
        {
            return ChavahLog.Log(session, message, exception, LogLevel.Error, details);
        }

        public static Task<ChavahLog> Warn(IAsyncDocumentSession session, string message, object details = null)
        {
            return ChavahLog.Log(session, message, null, LogLevel.Warn, details);
        }

        public static Task<ChavahLog> Info(IAsyncDocumentSession session, string message, object details = null)
        {
            return ChavahLog.Log(session, message, null, LogLevel.Info, details);
        }

        public static async Task<ChavahLog> Log(IAsyncDocumentSession session, string message, string exception, LogLevel logLevel, object details = null)
        {
            var log = new ChavahLog
            {
                DateTime = DateTime.UtcNow,
                Exception = exception,
                Message = message,
                Level = logLevel,
                Details = details
            };
            await session.StoreAsync(log);
            //record the session to the database
            await session.SaveChangesAsync();

            session.AddRavenExpiration(log, DateTime.UtcNow.AddDays(30));
            return log;
        }
    }
}