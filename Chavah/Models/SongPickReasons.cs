using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class SongPickReasons
    {
        public SongPickReasons()
        {
            this.LikedTags = new List<string>();
            this.LovedTags = new List<string>();
        }

        public string SongId { get; set; }

        [Obsolete("Removed; delete after 3/21/17. Use Artist instead")]
        public bool LikedArtist { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use Artist instead")]
        public bool LovedArtist { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use Album instead")]
        public bool LikedAlbum { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use Album instead")]
        public bool LovedAlbum { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use SongThumbedUp instead")]
        public bool LikedSong { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use Ranking instead")]
        public bool BestRanking { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use Ranking instead")]
        public bool GreatRanking { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use Ranking instead")]
        public bool GoodRanking { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use Similar instead")]
        public List<string> LikedTags { get; set; }
        [Obsolete("Removed; delete after 3/21/17. Use Similar instead")]
        public List<string> LovedTags { get; set; }

        public LikeLevel Artist { get; set; }
        public LikeLevel Album { get; set; }
        public bool SongThumbedUp { get; set; }
        public LikeLevel Ranking { get; set; }
        public LikeLevel Similar { get; set; }

        /// <summary>
        /// Used when the user requests a particular song, artist, album, or tag.
        /// </summary>
        public SongPick? SoleReason { get; set; }

        public static SongPickReasons FromSoleReason(SongPick playedReason)
        {
            return new SongPickReasons { SoleReason = playedReason };
        }
    }
}