using BitShuva.Chavah.Models;
using BitShuva.Services;
using System;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    public static class EmailSenderExtensions
    {
        public static void QueueEmailConfirmationAsync(this IEmailService emailSender, string destination, string link)
        {
            var subject = "Confirm your email";
            var body = $"Please confirm your account by clicking this link: <a href='{HtmlEncoder.Default.Encode(link)}'>link</a>";
            emailSender.QueueSendEmail(destination, subject, body);
        }

        public static void QueueResetPassword(this IEmailService emailSender, string toEmail, string resetCode, Application app)
        {
            var subject = $"{app.Title} - reset your password";
            var emailEscaped = Uri.EscapeDataString(toEmail.ToLower());
            var confirmationCodeEscaped = GetAngularRouteEscapedCode(resetCode);
            var confirmUrl = $"{app.DefaultUrl}/#/resetpassword/{emailEscaped}/{confirmationCodeEscaped}";
            var html = $"Shalom from {app.Title}!<p>Please <strong><a href='{confirmUrl}'>click here</a></strong> if you wish to reset your password.</p>";
            
            emailSender.QueueSendEmail(toEmail, subject, html);
        }

        public static void QueueConfirmEmail(this IEmailService emailSender, string toEmail, string confirmationCode, Application app)
        {
            var subject = $"{app.Title} - confirm your email";
            var emailEscaped = Uri.EscapeDataString(toEmail.ToLower());
            var confirmationCodeEscaped = GetAngularRouteEscapedCode(confirmationCode);
            var confirmUrl = $"{app.DefaultUrl}/#/confirmemail/{emailEscaped}/{confirmationCodeEscaped}";
            var html = $"Shalom from {app.Title}!<p>Please <strong><a href='{confirmUrl}'>click here</a></strong> to confirm your email address.</p>";
            
            emailSender.QueueSendEmail(toEmail, subject, html);
        }

        public static void QueueSupportEmail(this IEmailService emailSender, SupportMessage message, string recipient)
        {
            var subject = $"Support message from listener on Chavah Messianic Radio";
            var body = $@"
                <p>You received the following message via Chavah's support page:</p>
                <p>From: {message.Name}, {message.Email}
                    <br>User: {message.UserId}
                    <br>Dated: {message.Date.ToString()}
                    <br>User agent: {message.UserAgent}
                    <br>Message:
                </p>
                <p>{message.Message}</p>";
            emailSender.QueueSendEmail(recipient, subject, body, message.Email);
        }

        private static string GetAngularRouteEscapedCode(string input)
        {
            // Angular routes don't work with forward slashes, even if escaped. Replace with triple underscore.
            return Uri.EscapeDataString(input.Replace("/", "___"));
        }
    }
}
