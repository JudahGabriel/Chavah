using Raven.Client.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models.Transformers
{
    public class SongNameTransformer : AbstractTransformerCreationTask<Song>
    {
        public SongNameTransformer()
        {
            TransformResults = songs => from song in songs
                                        select new { song.Name };
        }

        public class SongName
        {
            public string Name { get; set; }
        }
    }
}