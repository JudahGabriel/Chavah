using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Raven.Migrations;

namespace BitShuva.Chavah.Models.Migrations
{
    /// <summary>
    /// Adds Artist.DonationRecipientId and Artist.DonationUrl.
    /// </summary>
    [Migration(6)]
    public class ArtistsHaveDonationRollup : Migration
    {
        public override void Up()
        {
            PatchCollection(@"
                from Artists
                update {
                    this.DonationRecipientId = null;
                    this.DonationUrl = null;
                }
            ");
        }
    }
}
