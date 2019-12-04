using System;
using System.IO;
using System.Linq;
using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;

using DalSoft.Hosting.BackgroundQueue;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents;
using Raven.StructuredLog;

using SendGrid.Helpers.Mail;

namespace BitShuva.Services
{
    /// <summary>
    /// Puts emails into the sending queue and stores them in the database.
    /// </summary>
    public class SendGridEmailService : IEmailService
    {
        private readonly EmailSettings emailOptions;
        private readonly ILogger<SendGridEmailService> logger;
        private readonly IDocumentStore db;
        private readonly BackgroundQueue backgroundWorker;
        private readonly IWebHostEnvironment host;

        public SendGridEmailService(
            BackgroundQueue queue,
            IDocumentStore db,
            IOptionsMonitor<EmailSettings> emailOptions,
            ILogger<SendGridEmailService> logger,
            IWebHostEnvironment host)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.db = db ?? throw new ArgumentNullException(nameof(db));
            backgroundWorker = queue ?? throw new ArgumentNullException(nameof(queue));
            this.host = host ?? throw new ArgumentNullException(nameof(host));

            this.emailOptions = emailOptions.CurrentValue;
        }

        public async Task QueueSendEmail(string recipient, string subject, string body, string? replyTo = null)
        {
            // Store the email on this thread.
            var email = await StoreEmail(recipient, subject, body, replyTo);

            // If we're not configured to send emails, punt.
            var sendEmails = emailOptions.SendEmails;
            if (sendEmails)
            {
                // Queue up the email sending on a different thread.
                logger.LogInformation("Queueing up {emailId} for sending.", email.Id);
                backgroundWorker.Enqueue(cancelToken => TrySendEmailWithTimeoutAndRetry(
                    email.Id!,
                    email.To,
                    email.Subject,
                    email.Body,
                    email.ReplyTo,
                    cancelToken));
            }
            else
            {
                logger.LogInformation("Skipping sending {emailId} per configuration.", email.Id);
            }
        }

        public Task QueueRetryEmail(string emailId)
        {
            backgroundWorker.Enqueue(_ => RetryEmailWithTimeout(emailId));
            return Task.CompletedTask;
        }

        private async Task RetryEmailWithTimeout(string emailId)
        {
            using var dbSession = db.OpenAsyncSession();
            var email = await dbSession.LoadRequiredAsync<Email>(emailId);
            var retryError = await TrySendEmailWithTimeout(email.To, email.Subject, email.Body, email.ReplyTo);

            email.RetryCount++;
            email.LastRetryDate = DateTimeOffset.UtcNow;
            email.SendingErrorMessage = retryError?.Message;
            email.Sent = retryError == null ? DateTimeOffset.UtcNow : new DateTimeOffset?();
            await dbSession.SaveChangesAsync();
        }

        private async Task TrySendEmailWithTimeoutAndRetry(string emailId, string recipient, string subject, string body, string? replyTo, CancellationToken cancelToken)
        {
            if (!cancelToken.IsCancellationRequested)
            {
                // Send the email with a timeout.
                var error = await TrySendEmailWithTimeout(recipient, subject, body, replyTo);
                if (error != null)
                {
                    await MarkEmailAsFailed(emailId, error);
                }
                else
                {
                    await MarkEmailAsSucceeded(emailId);
                }
            }
        }

        private async Task<Email> StoreEmail(string recipient, string subject, string body, string? replyTo)
        {
            using var dbSession = db.OpenAsyncSession();
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

        private async Task<Email> MarkEmailAsSucceeded(string emailId)
        {
            using var dbSession = db.OpenAsyncSession();
            var email = await dbSession.LoadRequiredAsync<Email>(emailId);
            email.Sent = DateTimeOffset.UtcNow;
            await dbSession.SaveChangesAsync();
            return email;
        }

        private async Task<Email> MarkEmailAsFailed(string emailId, Exception error)
        {
            using var dbSession = db.OpenAsyncSession();
            var email = await dbSession.LoadRequiredAsync<Email>(emailId);
            email.SendingErrorMessage = error.Message;
            await dbSession.SaveChangesAsync();
            return email;
        }

        private async Task<Exception?> TrySendEmailWithTimeout(string recipient, string subject, string body, string? replyTo)
        {
            try
            {
                using var email = new MailMessage
                {
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true,
                    From = new MailAddress(emailOptions.SenderEmail, emailOptions.SenderName)
                };

                if (!string.IsNullOrEmpty(replyTo))
                {
                    email.ReplyToList.Add(new MailAddress(replyTo));
                }

                email.To.Add(recipient);
                await SendEmailAsync(email);
                logger.LogInformation("Sent email notification from {sender} to {recipient} with {subject}, {body}, {replyto}", email.From?.Address, recipient, subject, body, email.ReplyToList?.ToString());
                return null;
            }
            catch (Exception error)
            {
                using (logger.BeginKeyValueScope("emailSettings", emailOptions))
                using (logger.BeginKeyValueScope("recipient", recipient))
                using (logger.BeginKeyValueScope("subject", subject))
                {
                    logger.LogError(error, "Failed to send email");
                }

                return error;
            }
        }

        public async Task SendEmailAsync(MailMessage message)
        {
            var client = new SendGrid.SendGridClient(emailOptions.SendGridApiKey);
            var from = new EmailAddress(message.From.Address, message.From.DisplayName);
            var subject = message.Subject;
            var to = message.To.Select(t => new EmailAddress(t.Address, t.DisplayName));
            var htmlContent = new Content("text/html", message.Body);
            var plainTextContent = Regex.Replace(htmlContent.Value, "<[^>]*>", "");
            var mail = MailHelper.CreateSingleEmailToMultipleRecipients(from, to.ToList(), subject, plainTextContent, htmlContent.Value);
            await client.SendEmailAsync(mail);
        }

        public string? GetEmailTemplate(string fileName)
        {
            var templatePath = Path.Combine(host.WebRootPath, Path.Combine("emails", fileName));
            try
            {
                if (File.Exists(templatePath))
                {
                    return File.ReadAllText(templatePath);
                }

                logger.LogError("Unable to find email template {templatePath}", templatePath);
            }
            catch (Exception error)
            {
                logger.LogError(error, "Error loading email template {name}", fileName);
            }

            return null;
        }
    }
}
