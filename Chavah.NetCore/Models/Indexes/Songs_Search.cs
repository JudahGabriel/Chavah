using Raven.Client.Documents.Indexes;
using Raven.Client.Documents.Linq.Indexing;
using System.Linq;

namespace BitShuva.Chavah.Models.Indexes
{
    public class Songs_Search : AbstractIndexCreationTask<Song, Songs_Search.Results>
    {
        public Songs_Search()
        {
            Map = songs => from song in songs
                           select new
                           {
                               Name = song.Name.Boost(3),
                               HebrewName = song.HebrewName.Boost(3),
                               Artist = song.Artist,
                               Album = song.Album
                           };

            Index(r => r.Name, FieldIndexing.Search);
            Index(r => r.Artist, FieldIndexing.Search);
            Index(r => r.Album, FieldIndexing.Search);
            Index(r => r.HebrewName, FieldIndexing.Search);
            Suggestion(r => r.Name);
            Suggestion(r => r.Artist);
            Suggestion(r => r.Album);
            Suggestion(r => r.HebrewName);
        }

        public class Results
        {
            public string Name { get; set; }
            public string HebrewName { get; set; }
            public string Artist { get; set; }
            public string Album { get; set; }
        }
    }
}