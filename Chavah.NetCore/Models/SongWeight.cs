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
        public double Weight => CommunityRankMultiplier * ArtistMultiplier * AlbumMultiplier * SongMultiplier * TagMultiplier;

        public static SongWeight Default()
        {
            return new SongWeight(1, 1, 1, 1, 1);
        }

        public SongWeight WithSongMultiplier(double songMultiplier)
        {
            return new SongWeight(CommunityRankMultiplier, ArtistMultiplier, AlbumMultiplier, songMultiplier, TagMultiplier);
        }

        public SongWeight WithAlbumMultiplier(double albumMultiplier)
        {
            return new SongWeight(CommunityRankMultiplier, ArtistMultiplier, albumMultiplier, SongMultiplier, TagMultiplier);
        }

        public SongWeight WithArtistMultiplier(double artistMultiplier)
        {
            return new SongWeight(CommunityRankMultiplier, artistMultiplier, AlbumMultiplier, SongMultiplier, TagMultiplier);
        }

        public SongWeight WithCommunityRankMultiplier(double communityRankMultiplier)
        {
            return new SongWeight(communityRankMultiplier, ArtistMultiplier, AlbumMultiplier, SongMultiplier, TagMultiplier);
        }

        public SongWeight WithTagMultiplier(double tagMultiplier)
        {
            return new SongWeight(CommunityRankMultiplier, ArtistMultiplier, AlbumMultiplier, SongMultiplier, tagMultiplier);
        }
    }
}
