using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Services;
using Quartz;
using Raven.Client.Documents;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Quartz.NET scheduling job that retries any emails that failed to send.
    /// Initialized by <see cref="QuartzAppBuilderExtensions"/>.
    /// </summary>
    public class EmailRetryJob : IJob
    {
        private readonly IDocumentStore docStore;
        private readonly IEmailService emailSender;

        private const int maxDaysOld = 7; // Any emails older than this won't be retried. TODO: move to config
        private const int maxRetryCount = 10; // Any emails retried more than this will be abandoned. TODO: move to config

        public EmailRetryJob(
            IDocumentStore docStore,
            IEmailService emailSender)
        {
            this.docStore = docStore;
            this.emailSender = emailSender;
        }

        async Task IJob.Execute(IJobExecutionContext context)
        {
            // Find failed emails that are less than a week old.
            using (var dbSession = this.docStore.OpenAsyncSession())
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
