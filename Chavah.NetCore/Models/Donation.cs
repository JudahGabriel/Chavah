using System;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A donation to an artist made through the Chavah app.
    /// </summary>
    public class Donation
    {
        /// <summary>
        /// The donated dollar amount in USD.
        /// </summary>
        public double Amount { get; set; }

        /// <summary>
        /// The name of the donor.
        /// </summary>
        public string DonorName { get; set; }

        /// <summary>
        /// The email of the donor.
        /// </summary>
        public string DonorEmail { get; set; }

        /// <summary>
        /// The date the donation was made.
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// The date the donation was distributed to the artist. This will be null if the donation hasn't yet been distributed.
        /// </summary>
        public DateTime? DistributionDate { get; set; }
    }
}
