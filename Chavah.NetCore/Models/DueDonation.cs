using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A record of donations due to an artist.
    /// </summary>
    public class DueDonation
    {
        /// <summary>
        /// The ID of the artist.
        /// </summary>
        public string ArtistId { get; set; } = string.Empty;

        /// <summary>
        /// The artist's name.
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// The amount in dollars due the artist.
        /// </summary>
        public double Amount { get; set; }

        /// <summary>
        /// The URL where donations can be disbursed.
        /// </summary>
        public Uri? DonationUrl { get; set; }

        /// <summary>
        /// The list of donations needing disbursement.
        /// </summary>
        public List<DonationContext> Donations { get; set; } = new List<DonationContext>();

        /// <summary>
        /// Whether the artist has declined donations.
        /// </summary>
        public bool HasDeclinedDonations { get; set; }

        /// <summary>
        /// The Paypal confirmation created for this donation.
        /// </summary>
        public PayPalOrderConfirmation? Order { get; set; }
    }
}
