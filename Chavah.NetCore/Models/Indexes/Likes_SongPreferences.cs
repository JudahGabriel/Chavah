using System.Linq;

using Raven.Client.Documents.Indexes;

namespace BitShuva.Chavah.Models.Indexes
{
    /// <summary>
    /// RavenDB index that creates a UserSongPreference objects containing the per-user like/dislikes for songs, artists, albums, and tags.
    /// Used by our song picking algorithm to intelligently choose a song based on a user's thumb-ups and -downs.
    /// </summary>
    public class Likes_SongPreferences : AbstractIndexCreationTask<Like, UserSongPreferences>
    {
        public Likes_SongPreferences()
        {
            // Map: Create a list of LikeDislikeCount for every song, album, artist, and tag.
            Map = likes => from like in likes
                           let song = LoadDocument<Song>(like.SongId)
                           where song != null
                           let likeCount = like.Status == LikeStatus.Like ? 1 : 0
                           let dislikeCount = like.Status == LikeStatus.Dislike ? 1 : 0
                           select new
                           {
                               like.UserId,
                               Songs = new LikeDislikeCount[]
                               {
                                    new LikeDislikeCount
                                    {
                                        Name = song.Name,
                                        LikeCount = likeCount,
                                        DislikeCount = dislikeCount,
                                        SongId = song.Id
                                    }
                               },

                               Artists = new LikeDislikeCount[]
                               {
                                    new LikeDislikeCount
                                    {
                                        Name = song.Artist,
                                        LikeCount = likeCount,
                                        DislikeCount = dislikeCount,
                                        SongId = song.Id
                                    }
                               },
                               Albums = new LikeDislikeCount[]
                               {
                                    new LikeDislikeCount
                                    {
                                        Name = song.Album,
                                        LikeCount = likeCount,
                                        DislikeCount = dislikeCount,
                                        SongId = song.Id
                                    },
                               },
                               Tags = song.Tags.Select(t => new LikeDislikeCount
                               {
                                   Name = t,
                                   LikeCount = likeCount,
                                   DislikeCount = dislikeCount,
                                   SongId = song.Id
                               }).ToList()
                           };

            // Reduce: Group the preferences by user and combine their LikeDislikeCounts.
            // This way, we can query UserSongPreference by user ID.
            Reduce = results => from result in results
                                group result by result.UserId into userGroup
                                select new UserSongPreferences
                                {
                                    UserId = userGroup.Key,
                                    Songs = userGroup.SelectMany(i => i.Songs).ToList(),
                                    Artists = userGroup.SelectMany(i => i.Artists).ToList(),
                                    Albums = userGroup.SelectMany(i => i.Albums).ToList(),
                                    Tags = userGroup.SelectMany(i => i.Tags).ToList()
                                };
        }
    }
}
