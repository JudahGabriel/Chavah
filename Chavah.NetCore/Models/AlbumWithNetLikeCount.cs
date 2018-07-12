using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A user's view of an album, containing the album data as well as the number of liked and disliked songs on the album.
    /// </summary>
    public class AlbumWithNetLikeCount : Album
    {
        /// <summary>
        /// Net count of liked songs on this album. If 3 songs on the album are thumbed up, and 1 is thumbed down, that's a net of 3 - 1 = 2.
        /// </summary>
        public int NetLikeCount { get; set; }

        /// <summary>
        /// The total number of songs on this album liked by the user.
        /// </summary>
        public int LikeCount { get; set; }

        /// <summary>
        /// The total number of songs on this album disliked by the user.
        /// </summary>
        public int DislikeCount { get; set; }

        /// <summary>
        /// The ID of the user whose net like count is listed.
        /// </summary>
        public string UserId { get; set; }
    }
}
