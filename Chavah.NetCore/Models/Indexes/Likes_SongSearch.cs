using Raven.Client.Documents.Indexes;
using Raven.Client.Documents.Linq.Indexing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Indexes
{
    /// <summary>
    /// Raven index for searching through a user's likes. Used from the /mylikes page.
    /// </summary>
    public class Likes_SongSearch : AbstractIndexCreationTask<Like, Likes_SongSearch.Result>
    {
        public Likes_SongSearch()
        {
            Map = likes => from like in likes
                           where like.Status == LikeStatus.Like
                           let song = LoadDocument<Song>(like.SongId)
                           select new Result
                           {
                               SongId = like.SongId,
                               UserId = like.UserId,
                               Date = like.Date,
                               Name = song.Name,
                               Artist = song.Artist,
                               Album = song.Album,
                               HebrewName = song.HebrewName,
                           };

            Index(r => r.Name, FieldIndexing.Search);
            Index(r => r.Artist, FieldIndexing.Search);
            Index(r => r.Album, FieldIndexing.Search);
            Index(r => r.HebrewName, FieldIndexing.Search);
        }

        public class Result
        {
            public DateTime Date { get; set; }
            public string UserId { get; set; }
            public string SongId { get; set; }
            public string Name { get; set; }
            public string Artist { get; set; }
            public string Album { get; set; }
            public string HebrewName { get; set; }
        }
    }
}
