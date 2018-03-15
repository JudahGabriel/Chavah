using BitShuva.Chavah.Models;
using BitShuva.Services;
using Microsoft.Extensions.DependencyInjection;
using Quartz;
using Raven.Client.Documents;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Quartz.NET scheduling job that retries any emails that failed to send. 
    /// Initialized by <see cref="EmailRetryServiceProvider"/>.
    /// </summary>
    public class EmailRetryJob : IJob
    {
        private static IServiceCollection services;
        private const int maxDaysOld = 7; // Any emails older than this won't be retried. TODO: move to config
        private const int maxRetryCount = 10; // Any emails retried more than this will be abandoned. TODO: move to config

        public static void Initialize(IServiceCollection services)
        {
            EmailRetryJob.services = services;
        }

        async Task IJob.Execute(IJobExecutionContext context)
        {
            // Find failed emails that are less than a week old.
            var svcProvider = services.BuildServiceProvider();
            var db = svcProvider.GetRequiredService<IDocumentStore>();
            var emailSender = svcProvider.GetRequiredService<IEmailService>();
            using (var dbSession = db.OpenAsyncSession())
            {
                var weekAgo = DateTime.UtcNow.Subtract(TimeSpan.FromDays(maxDaysOld));
                var failedEmailOrNull = await dbSession.Query<Email>()
                    .Where(e => e.SendingErrorMessage != null && e.Created >= weekAgo && e.RetryCount < maxRetryCount)
                    .OrderBy(e => e.RetryCount)
                    .FirstOrDefaultAsync();
                if (failedEmailOrNull != null)
                {
                    await emailSender.QueueRetryEmail(failedEmailOrNull.Id);
                }
            }
        }
    }
}
