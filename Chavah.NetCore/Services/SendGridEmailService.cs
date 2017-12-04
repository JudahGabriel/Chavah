using BitShuva.Chavah.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SendGrid.Helpers.Mail;
using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace BitShuva.Services
{
    public class SendGridEmailService : IEmailSender
    {
        private readonly AppSettings appSettings;
        private readonly ILogger<SendGridEmailService> logger;

        public SendGridEmailService(IOptions<AppSettings> appSettings, ILogger<SendGridEmailService> logger)
        {
            this.appSettings = appSettings?.Value;
            this.logger = logger;
        }

        public void QueueEmail(IdentityMessage message)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(_ =>
            {

                try
                {
                    var task = this.SendEmailAsync(message);
                    task.ConfigureAwait(continueOnCapturedContext: false);
                    task.Wait(TimeSpan.FromSeconds(30));
                }
                catch (Exception error)
                {
                    using (logger.BeginScope(message))
                    {
                        logger.LogError(error, "Unable to send email");
                    }
                }
            });
        }

        public async Task SendEmailAsync(IdentityMessage message)
        {
            var client = new SendGrid.SendGridClient(appSettings?.Email?.SendGridApiKey);

            var from = new EmailAddress(appSettings?.Email?.AdminEmail, appSettings?.Application?.Title);

            string subject = message.Subject;
            var to = new EmailAddress(message.Destination);
            var htmlContent = new Content("text/html", message.Body);
            var plainTextContent = Regex.Replace(htmlContent.Value, "<[^>]*>", "");

            var mail = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent.Value);
            await client.SendEmailAsync(mail);
        }
    }
}