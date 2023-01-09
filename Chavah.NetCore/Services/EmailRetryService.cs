using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;
using BitShuva.Services;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Background service that retries sending emails that previously erred when sending.
    /// </summary>
    public class EmailRetryService : TimedBackgroundServiceBase
    {
        private readonly IDocumentStore docStore;
        private readonly IEmailService emailSender;

        private const int maxDaysOld = 7; // Any emails older than this won't be retried. TODO: move to config
        private const int maxRetryCount = 10; // Any emails retried more than this will be abandoned. TODO: move to config

        public EmailRetryService(
            IDocumentStore docStore,
            IEmailService emailSender,
            IOptions<EmailSettings> emailSettings,
            ILogger<EmailRetryService> logger)
            : base(TimeSpan.FromHours(1), TimeSpan.FromMinutes(emailSettings.Value.RetryFailedEmailTimeInMinutes), logger)
        {
            this.docStore = docStore;
            this.emailSender = emailSender;
        }

        public override async Task DoWorkAsync(CancellationToken cancelToken)
        {
            try
            {
                // Find failed emails that are less than a week old.
                using var dbSession = docStore.OpenAsyncSession();
                var weekAgo = DateTime.UtcNow.Subtract(TimeSpan.FromDays(maxDaysOld));
                var failedEmailOrNull = await dbSession.Query<Email>()
                    .Where(e => e.SendingErrorMessage != null && e.Created >= weekAgo && e.RetryCount < maxRetryCount)
                    .OrderBy(e => e.RetryCount)
                    .FirstOrDefaultAsync(cancelToken);
                if (failedEmailOrNull != null && failedEmailOrNull.Id != null)
                {
                    await emailSender.QueueRetryEmail(failedEmailOrNull.Id);
                }
            }
            catch (Exception error)
            {
                logger.LogError(error, "Error when retrying to send failed emails.");
            }
        }
    }
}
