using System;
using System.Threading.Tasks;

namespace BitShuva.Services
{
    public interface IEmailSender
    {
        IdentityMessage ConfirmEmail(string toEmail, string confirmationCode, Uri hostUri);
        IdentityMessage ResetPassword(string toEmail, string resetCode, Uri hostUri);
        Task SendAsync(IdentityMessage message);
        Task SendEmailAsync(string email, string subject, string message);

    }
}