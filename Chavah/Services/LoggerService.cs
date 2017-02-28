using BitShuva.Models;
using Raven.Client;
using System;
using System.Threading.Tasks;
using BitShuva.Common;
using BitShuva.Interfaces;

namespace BitShuva.Services
{
    /// <summary>
    /// Basic Log Service for the project
    /// </summary>
    public class LoggerService : ILoggerService
    {
        private IAsyncDocumentSession _session;

        public LoggerService(IAsyncDocumentSession session)
        {
            _session = session;
        }

        public Task<ChavahLog> Error(string message,
                                     string exception, 
                                     object details = null)
        {
            return Log(message, exception, LogLevel.Error, details);
        }

        public Task<ChavahLog> Warn(string message,
                                    object details = null)
        {
            return Log(message, null, LogLevel.Warn, details);
        }

        public Task<ChavahLog> Info(string message, 
                                    object details = null)
        {
            return this.Log(message, null, LogLevel.Info, details);
        }

        public async Task<ChavahLog> Log(string message, 
                                            string exception, 
                                            LogLevel logLevel, 
                                            object details = null)
        {
            var log = new ChavahLog
            {
                DateTime = DateTime.UtcNow,
                Exception = exception,
                Message = message,
                Level = logLevel,
                Details = details
            };
            await _session.StoreAsync(log);
            //record the session to the database
            await _session.SaveChangesAsync();

            _session.AddRavenExpiration(log, DateTime.UtcNow.AddDays(30));
            return log;
        }

    }
}