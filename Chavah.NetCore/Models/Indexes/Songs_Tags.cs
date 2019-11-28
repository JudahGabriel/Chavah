using System.Linq;

using Raven.Client.Documents.Indexes;

namespace BitShuva.Chavah.Models.Indexes
{
    /// <summary>
    /// RavenDB index that gets all the unique tags from all songs.
    /// </summary>
    public class Songs_Tags : AbstractIndexCreationTask<Song, Songs_Tags.Result>
    {
        public Songs_Tags()
        {
            Map = songs => from song in songs
                           from tag in song.Tags
                           select new Result
                           {
                               Name = tag
                           };

            Reduce = results => from result in results
                                group result by result.Name into g
                                select new Result
                                {
                                    Name = g.Key
                                };

            Index(r => r.Name, FieldIndexing.Search);
        }

        public class Result
        {
            public string Name { get; set; } = string.Empty;
        }
    }
}
