using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Raven.Migrations;

namespace BitShuva.Chavah.Models.Migrations
{
    [Migration(5)]
    public class ArtistsHaveDisambiguation : Migration
    {
        public override void Up()
        {
            PatchCollection(@"
                from Artists
                update {
                    this.Disambiguation = null;
                }
            ");
        }
    }
}
