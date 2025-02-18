using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Raven.Migrations;

namespace BitShuva.Chavah.Models.Migrations;

[Migration(8)]
public class ArtistsCanDeclineDonations : Migration
{
    public override void Up()
    {
        this.PatchCollection(@"
                from Artists
                update {
                    this.HasDeclinedDonations = false;
                }
            ");
    }
}
