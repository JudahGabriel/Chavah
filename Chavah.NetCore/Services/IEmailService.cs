using Microsoft.AspNetCore.Hosting;
using Optional;
using System;
using System.Threading.Tasks;

namespace BitShuva.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Stores it in the database and queues it up for sending.
        /// </summary>
        /// <param name="recipient">The email address of the recipient. For multiple recipients, separate with a comma.</param>
        /// <param name="subject"></param>
        /// <param name="body"></param>
        /// <param name="replyTo">Who replies should be sent to. If null, will use Chavah's email adddress.</param>
        /// <returns>A task that stores the email in the database.</returns>
        Task QueueSendEmail(string recipient, string subject, string body, string replyTo = null);
        
        /// <summary>
        /// Sends an email that previously failed to send.
        /// </summary>
        /// <param name="emailId">The ID of the email to retry.</param>
        /// <returns>A task that queues up the email in the outgoing email queue.</returns>
        Task QueueRetryEmail(string emailId);

        /// <summary>
        /// Gets an email template from the file name.
        /// </summary>
        Option<string> GetEmailTemplate(string fileName);
    }
}