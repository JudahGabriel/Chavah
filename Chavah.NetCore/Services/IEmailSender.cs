using System;
using System.Threading.Tasks;

namespace BitShuva.Services
{
    public interface IEmailSender
    {
        Task SendEmailAsync(IdentityMessage message);
        void QueueEmail(IdentityMessage message);
    }
}