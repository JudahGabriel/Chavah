using System;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class Artist
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<string> Images { get; set; } = new List<string>();
        public string? Bio { get; set; }
        public List<Donation> Donations { get; set; } = new List<Donation>();

        /// <summary>
        /// Optional disambiguation that distinguishes between 2 same-named artists.
        /// For example, if 2 artists have the same name, the disambiguation might be album name.
        /// </summary>
        public string? Disambiguation { get; set; }

        /// <summary>
        /// The ID of the artist who should receive this artist's donations.
        /// For example, a disbanded artist group may have their donations rolled up into the donations for the leader of the group.
        /// </summary>
        public string? DonationRecipientId { get; set; }

        /// <summary>
        /// The URI where donations can be distributed to the artist.
        /// </summary>
        public Uri? DonationUrl { get; set; }

        /// <summary>
        /// Whether the artist has declined accepting donations from Chavah.
        /// </summary>
        public bool HasDeclinedDonations { get; set; }

        /// <summary>
        /// Gets the name of the artist including any disambiguation.
        /// </summary>
        /// <returns></returns>
        public string GetNameWithDisambiguation()
        {
            if (string.IsNullOrEmpty(this.Disambiguation))
            {
                return this.Name;
            }

            return $"{this.Name} ({this.Disambiguation})";
        }
    }
}
