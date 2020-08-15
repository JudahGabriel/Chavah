using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Raven.Migrations;

namespace BitShuva.Chavah.Models.Migrations
{
    [Migration(7)]
    public class AlbumsHaveHebrewName : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from Albums
                update {
                    this.HebrewName = null;
                }
            ");

            this.PatchCollection(@"
                from Songs
                update {
                    this.AlbumHebrewName = null;
                }
            ");
        }
    }
}
