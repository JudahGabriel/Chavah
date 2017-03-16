using BitShuva.Models;
using Raven.Client;
using System;
using System.Threading.Tasks;
using BitShuva.Common;
using BitShuva.Interfaces;
using Raven.Client.Linq;
using System.Collections.Generic;

namespace BitShuva.Services
{
    /// <summary>
    /// Basic Log Service for the project
    /// </summary>
    public class LoggerService : ILoggerService
    {        
        public LoggerService()
        {
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

        public async Task<ChavahLog> Log(
            string message, 
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

            // Newing up our own session here. Needed because we're calling .SaveChanges and we don't want to commit other in-progress changes.
            using (var session = RavenContext.Db.OpenAsyncSession())
            {
                await session.StoreAsync(log);
                session.AddRavenExpiration(log, DateTime.UtcNow.AddDays(30));
                await session.SaveChangesAsync();
            }

            return log;
        }

        public async Task<IList<Activity>> GetActivity(int take)
        {
            using (var session = RavenContext.Db.OpenAsyncSession())
            {
                return await session.Query<Activity>()
                    .OrderByDescending(a => a.DateTime)
                    .Take(take)
                    .ToListAsync();
            }
        }
    }
}