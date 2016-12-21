using Raven.Client.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models.Indexes
{
    public class Album_Dupes : AbstractIndexCreationTask<Album, AlbumDupe>
    {
        public Album_Dupes()
        {
            Map = albums => from album in albums
                            select new AlbumDupe
                            {
                                Name = album.Artist + " - " + album.Name,
                                AlbumIds = new List<string>(2) { album.Id },
                                Count = 1,
                            };

            Reduce = dupes => from dupe in dupes
                              group dupe by dupe.Name into g
                              select new AlbumDupe
                              {
                                  Name = g.Key,
                                  AlbumIds = g.SelectMany(i => i.AlbumIds).ToList(),
                                  Count = g.Sum(d => d.Count)
                              };
        }
    }
}