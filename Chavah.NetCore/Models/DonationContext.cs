using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A donation with related artist information. Some artists have their donations go to other artists via <see cref="Artist.DonationRecipientId"/>. For example, Jamie Hilsden has his donations go to his band, Miqedem.
    /// This models that context: a donation with context about who the donation was originally for (e.g. Jamie Hilsden).
    /// </summary>
    public class DonationContext : Donation
    {
        public string? RecipientArtist { get; set; }

        public static DonationContext FromDonation(Donation donation, string? recipientArtist)
        {
            var donationContext = new DonationContext();
            donationContext.CopyPropsFrom(donation);
            donationContext.RecipientArtist = recipientArtist;
            return donationContext;
        }
    }
}
