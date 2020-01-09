using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Raven.Migrations;

namespace BitShuva.Chavah.Models.Migrations
{
    [Migration(3)]
    public class SongsHaveContributingArtists : Migration
    {
        public override void Up()
        {
            PatchCollection(@"
                from Songs
                update {
                    this.ContributingArtists = [];
                }
            ");                
        }
    }
}
