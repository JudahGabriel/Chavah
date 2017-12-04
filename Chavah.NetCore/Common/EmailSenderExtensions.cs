using BitShuva.Chavah.Models;
using BitShuva.Services;
using System;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    public static class EmailSenderExtensions
    {
        public static void QueueEmailConfirmationAsync(this IEmailSender emailSender, string destination, string link)
        {
            var email = new IdentityMessage
            {
                Body = $"Please confirm your account by clicking this link: <a href='{HtmlEncoder.Default.Encode(link)}'>link</a>",
                Destination = destination,
                Subject = "Confirm your email"
            };
            emailSender.QueueEmail(email);
        }

        public static void QueueResetPassword(this IEmailSender emailSender, string toEmail, string resetCode, Application app)
        {
            var subject = $"{app.Title} - reset your password";
            var emailEscaped = Uri.EscapeDataString(toEmail.ToLower());
            var confirmationCodeEscaped = GetAngularRouteEscapedCode(resetCode);
            var confirmUrl = $"{app.DefaultUrl}/#/resetpassword/{emailEscaped}/{confirmationCodeEscaped}";
            var html = $"Shalom from {app.Title}!<p>Please <strong><a href='{confirmUrl}'>click here</a></strong> if you wish to reset your password.</p>";

            var email = new IdentityMessage
            {
                Body = html,
                Destination = toEmail,
                Subject = subject
            };
            emailSender.QueueEmail(email);
        }

        public static void QueueConfirmEmail(this IEmailSender emailSender, string toEmail, string confirmationCode, Application app)
        {
            var subject = $"{app.Title} - confirm your email";
            var emailEscaped = Uri.EscapeDataString(toEmail.ToLower());
            var confirmationCodeEscaped = GetAngularRouteEscapedCode(confirmationCode);
            var confirmUrl = $"{app.DefaultUrl}/#/confirmemail/{emailEscaped}/{confirmationCodeEscaped}";
            var html = $"Shalom from {app.Title}!<p>Please <strong><a href='{confirmUrl}'>click here</a></strong> to confirm your email address.</p>";

            var email = new IdentityMessage
            {
                Body = html,
                Destination = toEmail,
                Subject = subject
            };
            emailSender.QueueEmail(email);
        }

        private static string GetAngularRouteEscapedCode(string input)
        {
            // Angular routes don't work with forward slashes, even if escaped. Replace with triple underscore.
            return Uri.EscapeDataString(input.Replace("/", "___"));
        }
    }
}
