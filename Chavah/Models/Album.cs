using System;

namespace BitShuva.Models
{
    /// <summary>
    /// An album for which album art has been uploaded.
    /// </summary>
    public class Album
    {
        public string Artist { get; set; }
        public string Name { get; set; }
        public Uri AlbumArtUri { get; set; }
        public string Id { get; set; }
        public string BackgroundColor { get; set; }
        public string ForegroundColor { get; set; }
        public string MutedColor { get; set; }
        public string TextShadowColor { get; set; }
        public bool IsVariousArtists { get; set; }
        public int SongCount { get; set; }

        public System.Linq.Expressions.Expression<Func<Song, bool>> SongMatchesAlbumNameAndArtistCriteria()
        {
            if (this.IsVariousArtists)
            {
                return s => s.Album == this.Name;
            }
            else
            {
                return s => s.Album == this.Name && s.Artist == this.Artist;
            }
        }
    }
}