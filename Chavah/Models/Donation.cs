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
        public string DonorName { get; set; } = string.Empty;

        /// <summary>
        /// The email of the donor.
        /// </summary>
        public string DonorEmail { get; set; } = string.Empty;

        /// <summary>
        /// The date the donation was made.
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// The date the donation was distributed to the artist. This will be null if the donation hasn't yet been distributed.
        /// </summary>
        public DateTime? DistributionDate { get; set; }

        public static Donation CreateMessiahsMusicFundDonation(int year, int month, decimal donationAmount)
        {
            var date = new DateTimeOffset(year, month, 1, 0, 0, 0, TimeSpan.Zero);
            return new Donation
            {
                Amount = (double)donationAmount,
                Date = date.Date,
                DistributionDate = null,
                DonorEmail = "chavah@messianicradio.com",
                DonorName = "Messiah's Music Fund"
            };
        }
    }
}
