using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A user's view of an artist, containing the artist data as well as the number of songs by this artist liked and disliked by the user.
    /// </summary>
    public class ArtistWithNetLikeCount : Artist
    {
        /// <summary>
        /// Net count of liked songs on for this artist. If 3 songs on the album are thumbed up, and 1 is thumbed down, that's a net of 3 - 1 = 2.
        /// </summary>
        public int NetLikeCount { get; set; }

        /// <summary>
        /// The total number of songs by this artist liked by the user.
        /// </summary>
        public int LikeCount { get; set; }

        /// <summary>
        /// The total number of songs by this artist disliked by the user.
        /// </summary>
        public int DislikeCount { get; set; }

        /// <summary>
        /// The ID of the user whose net like count is listed.
        /// </summary>
        public string UserId { get; set; }
    }
}
