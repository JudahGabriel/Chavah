using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using DalSoft.Hosting.BackgroundQueue;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Optional;
using Optional.Async;
using Raven.Client.Documents;
using Raven.StructuredLog;
using SendGrid.Helpers.Mail;
using System;
using System.Linq;
using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace BitShuva.Services
{
    /// <summary>
    /// Puts emails into the sending queue and stores them in the database.
    /// </summary>
    public class SendGridEmailService : IEmailService
    {
        private readonly EmailSettings emailSettings;
        private readonly ILogger<SendGridEmailService> logger;
        private readonly IDocumentStore db;
        private readonly BackgroundQueue backgroundWorker;

        public SendGridEmailService(BackgroundQueue queue, IDocumentStore db, IOptions<AppSettings> appSettings, ILogger<SendGridEmailService> logger)
        {
            this.emailSettings = appSettings.Value.Email;
            this.logger = logger;
            this.db = db;
            this.backgroundWorker = queue;
        }

        public async Task QueueSendEmail(string recipient, string subject, string body, string replyTo = null)
        {
            // Store the email on this thread.
            var email = await StoreEmail(recipient, subject, body, replyTo);

            // If we're not configured to send emails, punt.
            var sendEmails = this.emailSettings.SendEmails;
            if (sendEmails)
            {
                // Queue up the email sending on a different thread.
                logger.LogInformation("Queueing up {emailId} for sending.", email.Id);
                this.backgroundWorker.Enqueue(cancelToken => TrySendEmailWithTimeoutAndRetry(email.Id, email.To, email.Subject, email.Body, email.ReplyTo, cancelToken));
            }
            else
            {
                logger.LogInformation("Skipping sending {emailId} per configuration.", email.Id);
            }
        }

        public Task QueueRetryEmail(string emailId)
        {
            this.backgroundWorker.Enqueue(_ => RetryEmailWithTimeout(emailId));
            return Task.CompletedTask;
        }

        private async Task RetryEmailWithTimeout(string emailId)
        {
            using (var dbSession = this.db.OpenAsyncSession())
            {
                var email = await dbSession.LoadRequiredAsync<Email>(emailId);
                var retryError = await TrySendEmailWithTimeout(email.To, email.Subject, email.Body, email.ReplyTo);

                email.RetryCount++;
                email.LastRetryDate = DateTimeOffset.UtcNow;
                email.SendingErrorMessage = retryError
                    .Map(e => e.Message)
                    .ValueOrDefault();
                email.Sent = retryError.Match(error => new DateTimeOffset?(), () => DateTimeOffset.UtcNow);
                await dbSession.SaveChangesAsync();
            }
        }

        private Task TrySendEmailWithTimeoutAndRetry(string emailId, string recipient, string subject, string body, string replyTo, CancellationToken cancelToken)
        {
            if (!cancelToken.IsCancellationRequested)
            {
                // Send the email with a timeout.
                var error = TrySendEmailWithTimeout(recipient, subject, body, replyTo).ToAsyncOption();

                // The error will be None if success. If failed, mark it as failed, which will get queued up for email retry later.
                return error
                    .Match(e => MarkEmailAsFailed(emailId, e), () => MarkEmailAsSucceeded(emailId));
            }

            return Task.CompletedTask;
        }

        private async Task<Email> StoreEmail(string recipient, string subject, string body, string replyTo)
        {
            using (var dbSession = this.db.OpenAsyncSession())
            {
                var email = new Email
                {
                    To = recipient,
                    Subject = subject,
                    Body = body,
                    ReplyTo = replyTo
                };
                await dbSession.StoreAsync(email);

                // Expire it in 2 months.
                dbSession.SetRavenExpiration(email, DateTime.UtcNow.AddMonths(2));

                await dbSession.SaveChangesAsync();
                return email;
            }
        }

        private async Task<Email> MarkEmailAsSucceeded(string emailId)
        {
            using (var dbSession = this.db.OpenAsyncSession())
            {
                var email = await dbSession.LoadRequiredAsync<Email>(emailId);
                email.Sent = DateTimeOffset.UtcNow;
                await dbSession.SaveChangesAsync();
                return email;
            }
        }

        private async Task<Email> MarkEmailAsFailed(string emailId, Exception error)
        {
            using (var dbSession = this.db.OpenAsyncSession())
            {
                var email = await dbSession.LoadRequiredAsync<Email>(emailId);
                email.SendingErrorMessage = error.Message;
                await dbSession.SaveChangesAsync();
                return email;
            }
        }

        private async Task<Option<Exception>> TrySendEmailWithTimeout(string recipient, string subject, string body, string replyTo)
        {
            try
            {
                var email = new MailMessage
                {
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true,
                    From = new MailAddress(emailSettings.SenderEmail, emailSettings.SenderName)
                };

                if (!string.IsNullOrEmpty(replyTo))
                {
                    email.ReplyToList.Add(replyTo);
                }

                email.To.Add(recipient);
                await SendEmailAsync(email);
                logger.LogInformation("Sent email notification from {sender} to {recipient} with {subject}, {body}, {replyto}", email.From?.Address, recipient, subject, body, email.ReplyToList?.ToString());
                return Option.None<Exception>();
            }
            catch (Exception error)
            {
                using (logger.BeginKeyValueScope("emailSettings", emailSettings))
                using (logger.BeginKeyValueScope("recipient", recipient))
                using (logger.BeginKeyValueScope("subject", subject))
                {
                    logger.LogError(error, "Failed to send email");
                }

                return Option.Some(error);
            }
        }

        public async Task SendEmailAsync(MailMessage message)
        {
            var client = new SendGrid.SendGridClient(this.emailSettings.SendGridApiKey);
            var from = new EmailAddress(message.From.Address, message.From.DisplayName);
            var subject = message.Subject;
            var to = message.To.Select(t => new EmailAddress(t.Address, t.DisplayName));
            var htmlContent = new Content("text/html", message.Body);
            var plainTextContent = Regex.Replace(htmlContent.Value, "<[^>]*>", "");
            var mail = MailHelper.CreateSingleEmailToMultipleRecipients(from, to.ToList(), subject, plainTextContent, htmlContent.Value);
            await client.SendEmailAsync(mail);
        }
    }
}