using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// Represents a song weight, indicating its likelihood of being chosen as a song pick.
    /// See UserSongPreferences for song picking algorithm details.
    /// </summary>
    public struct SongWeight
    {
        public SongWeight(double communityRankMultiplier, double artistMultiplier, double albumMultiplier, double songMultiplier, double tagMultiplier)
        {
            CommunityRankMultiplier = communityRankMultiplier;
            ArtistMultiplier = artistMultiplier;
            AlbumMultiplier = albumMultiplier;
            SongMultiplier = songMultiplier;
            TagMultiplier = tagMultiplier;
        }
        
        public readonly double CommunityRankMultiplier;
        public readonly double ArtistMultiplier;
        public readonly double AlbumMultiplier;
        public readonly double SongMultiplier;
        public readonly double TagMultiplier;

        /// <summary>
        /// Computes the song weight using the current multiplier values.
        /// </summary>
        public double Weight
        {
            get
            {
                return CommunityRankMultiplier * ArtistMultiplier * AlbumMultiplier * SongMultiplier * TagMultiplier;
            }
        }

        public static SongWeight Default()
        {
            return new SongWeight(1, 1, 1, 1, 1);
        }

        public SongWeight WithSongMultiplier(double songMultiplier)
        {
            return new SongWeight(this.CommunityRankMultiplier, this.ArtistMultiplier, this.AlbumMultiplier, songMultiplier, this.TagMultiplier);
        }

        public SongWeight WithAlbumMultiplier(double albumMultiplier)
        {
            return new SongWeight(this.CommunityRankMultiplier, this.ArtistMultiplier, albumMultiplier, this.SongMultiplier, this.TagMultiplier);
        }

        public SongWeight WithArtistMultiplier(double artistMultiplier)
        {
            return new SongWeight(this.CommunityRankMultiplier, artistMultiplier, this.AlbumMultiplier, this.SongMultiplier, this.TagMultiplier);
        }

        public SongWeight WithCommunityRankMultiplier(double communityRankMultiplier)
        {
            return new SongWeight(communityRankMultiplier, this.ArtistMultiplier, this.AlbumMultiplier, this.SongMultiplier, this.TagMultiplier);
        }

        public SongWeight WithTagMultiplier(double tagMultiplier)
        {
            return new SongWeight(this.CommunityRankMultiplier, this.ArtistMultiplier, this.AlbumMultiplier, this.SongMultiplier, tagMultiplier);
        }
    }
}