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
        public bool LikedArtist { get; set; }
        public bool LovedArtist { get; set; }
        public bool LikedAlbum { get; set; }
        public bool LovedAlbum { get; set; }
        public bool LikedSong { get; set; }
        public bool BestRanking { get; set; }
        public bool GreatRanking { get; set; }
        public bool GoodRanking { get; set; }
        public List<string> LikedTags { get; set; }
        public List<string> LovedTags { get; set; }
        
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