using Raven.Client.Documents.Indexes;
using Raven.Client.Documents.Linq.Indexing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Indexes
{
    /// <summary>
    /// Raven index for searching a user's liked albums.
    /// </summary>
    public class Likes_ByAlbum : AbstractIndexCreationTask<Like, AlbumWithNetLikeCount>
    {
        public Likes_ByAlbum()
        {
            Map = likes => from like in likes
                           let song = LoadDocument<Song>(like.SongId)
                           let album = LoadDocument<Album>(song.AlbumId)
                           let isLiked = like.Status == LikeStatus.Like
                           select new AlbumWithNetLikeCount
                           {
                               UserId = like.UserId,
                               Id = album.Id,
                               Name = album.Name,
                               Artist = album.Artist,
                               NetLikeCount = isLiked ? 1 : -1,
                               BackgroundColor = album.BackgroundColor,
                               ForegroundColor = album.ForegroundColor,
                               MutedColor = album.MutedColor,
                               TextShadowColor = album.TextShadowColor,
                               AlbumArtUri = album.AlbumArtUri,
                               LikeCount = isLiked ? 1 : 0,
                               DislikeCount = isLiked ? 0 : 1
                           };

            Reduce = results => from result in results
                                group result by result.Id into albumGroup
                                let netLikeCount = albumGroup.Sum(i => i.NetLikeCount)
                                orderby netLikeCount descending
                                let album = albumGroup.First()
                                select new AlbumWithNetLikeCount
                                {
                                    UserId = album.UserId,
                                    Id = albumGroup.Key,
                                    Name = album.Name,
                                    Artist = album.Artist,
                                    NetLikeCount = netLikeCount,
                                    LikeCount = albumGroup.Sum(i => i.LikeCount),
                                    DislikeCount = albumGroup.Sum(i => i.DislikeCount),
                                    AlbumArtUri = album.AlbumArtUri,
                                    BackgroundColor = album.BackgroundColor,
                                    ForegroundColor = album.ForegroundColor,
                                    MutedColor = album.MutedColor,
                                    TextShadowColor = album.TextShadowColor
                                };

            Index(r => r.Name, FieldIndexing.Search);
            StoreAllFields(FieldStorage.Yes);
        }
    }
}
