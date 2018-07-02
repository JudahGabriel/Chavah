using Raven.Client.Documents.Indexes;
using Raven.Client.Documents.Linq.Indexing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Indexes
{
    /// <summary>
    /// Raven index for searching a user's liked artists.
    /// </summary>
    public class Likes_ByArtist : AbstractIndexCreationTask<Like, ArtistWithNetLikeCount>
    {
        public Likes_ByArtist()
        {
            Map = likes => from like in likes
                           let song = LoadDocument<Song>(like.SongId)
                           let artist = LoadDocument<Artist>(song.ArtistId)
                           let isLiked = like.Status == LikeStatus.Like
                           select new ArtistWithNetLikeCount
                           {
                               Id = artist.Id,
                               Name = artist.Name,
                               Bio = artist.Bio,
                               Images = artist.Images,
                               UserId = like.UserId,
                               NetLikeCount = isLiked ? 1 : -1,
                               LikeCount = isLiked ? 1 : 0,
                               DislikeCount = isLiked ? 0 : 1,
                           };

            Reduce = results => from result in results
                                group result by result.Id into artistGroup
                                let netLikeCount = artistGroup.Sum(i => i.NetLikeCount)
                                orderby netLikeCount descending
                                let artist = artistGroup.First()
                                select new ArtistWithNetLikeCount
                                {
                                    Id = artist.Id,
                                    Name = artist.Name,
                                    Bio = artist.Bio,
                                    Images = artist.Images,
                                    UserId = artist.UserId,
                                    NetLikeCount = artistGroup.Sum(a => a.NetLikeCount),
                                    LikeCount = artistGroup.Sum(a => a.LikeCount),
                                    DislikeCount = artistGroup.Sum(a => a.DislikeCount),
                                };

            Index(r => r.Name, FieldIndexing.Search);
            StoreAllFields(FieldStorage.Yes);
        }
    }
}
