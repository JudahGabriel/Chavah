using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Services
{
    public class SendGridEmailService : IIdentityMessageService
    {
        public SendGridEmailService(IOptions options)
        {
            this.options = options;
        }
        public static IdentityMessage ConfirmEmail(string toEmail, string confirmationCode, Uri hostUri)
        {
            var subject = "Chavah Messianic Radio - confirm your email";
            var emailEscaped = Uri.EscapeDataString(toEmail.ToLower());
            var confirmationCodeEscaped = GetAngularRouteEscapedCode(confirmationCode);
            var confirmUrl = $"{GetAppUrl(hostUri)}/#/confirmemail/{emailEscaped}/{confirmationCodeEscaped}";
            var html = $"Shalom from Chavah!<p>Please <strong><a href='{confirmUrl}'>click here</a></strong> to confirm your email address.</p>";

            return new IdentityMessage
            {
                Body = html,
                Destination = toEmail,
                Subject = subject
            };
        }

        public static IdentityMessage ResetPassword(string toEmail, string resetCode, Uri hostUri)
        {
            var subject = "Chavah Messianic Radio - reset your password";
            var emailEscaped = Uri.EscapeDataString(toEmail.ToLower());
            var confirmationCodeEscaped = GetAngularRouteEscapedCode(resetCode);
            var confirmUrl = $"{GetAppUrl(hostUri)}/#/resetpassword/{emailEscaped}/{confirmationCodeEscaped}";
            var html = $"Shalom from Chavah!<p>Please <strong><a href='{confirmUrl}'>click here</a></strong> if you wish to reset your password.</p>";

            return new IdentityMessage
            {
                Body = html,
                Destination = toEmail,
                Subject = subject
            };
        }

        public async Task SendAsync(IdentityMessage message)
        {
            var sendGridApiKey = ConfigurationManager.AppSettings["SendGridApiKey"];
            var sendGrid = new SendGrid.SendGridAPIClient(sendGridApiKey);
            var from = new Email("chavah@messianicradio.com", "Chavah Messianic Radio");
            string subject = message.Subject;
            var to = new Email(message.Destination);
            var content = new Content("text/html", message.Body);
            var mail = new Mail(from, subject, to, content);

            dynamic response = await sendGrid.client.mail.send.post(requestBody: mail.Get());
        }

        private static string GetAppUrl(Uri hostUri)
        {
            var portString = hostUri.Port != 443 && hostUri.Port != 80 ? $":{hostUri.Port}" : "";
            return $"{hostUri.Scheme}://{hostUri.Host}{portString}";
        }

        private static string GetAngularRouteEscapedCode(string input)
        {
            // Angular routes don't work with forward slashes, even if escaped. Replace with triple underscore.
            return Uri.EscapeDataString(input.Replace("/", "___"));
        }
    }
}