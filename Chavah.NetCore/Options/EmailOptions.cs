namespace BitShuva.Chavah.Options
{
    public class EmailOptions
    {
        /// <summary>
        /// Send Grid Api Key
        /// </summary>
        public string SendGridApiKey { get; set; }

        /// <summary>
        /// Send emails. The Default is set to true.
        /// </summary>
        public bool SendEmails { get; set; } = true;

        /// <summary>
        /// Name of the sender.
        /// </summary>
        public string SenderName { get; set; }

        /// <summary>
        /// Email of the sender.
        /// </summary>
        public string SenderEmail { get; set; }

        /// <summary>
        /// Wait for the retried to send failed emails.
        /// </summary>
        public int RetryFailedEmailTimeInMinutes { get; set; }
    }
}
