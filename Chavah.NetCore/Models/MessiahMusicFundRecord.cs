using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A record of Messiah's Music Fund disbursement for an artist.
    /// </summary>
    /// <remarks>
    /// See https://blog.messianicradio.com/2020/06/announcing-messiahs-musicians-fund-we.html
    /// </remarks>
    public class MessiahMusicFundRecord
    {
        /// <summary>
        /// The ID of the artist.
        /// </summary>
        public string? ArtistId { get; set; }

        /// <summary>
        /// The ID of the artist who receives this artist's donations.
        /// For example, the artist "Ted Pearce & Cultural Xchange" will have its donations sent to the artist "Ted Pearce".
        /// </summary>
        public string? DonationRecipientId { get; set; }

        /// <summary>
        /// The name of the artist.
        /// </summary>
        public string? ArtistName { get; set; }

        /// <summary>
        /// The number of artist song plays for the time period.
        /// </summary>
        public long Plays { get; set; }

        /// <summary>
        /// What percent of the total plays on Chavah for the time period were plays from this artist.
        /// </summary>
        public double PlayPercentage { get; set; }

        /// <summary>
        /// The total money disbursement belonging to this artist for the time period.
        /// </summary>
        public decimal Disbursement { get; set; }
    }
}
