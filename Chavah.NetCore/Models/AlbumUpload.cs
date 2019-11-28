using System;
using System.Collections.Generic;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    public class AlbumUpload
    {
        public string Name { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public Uri AlbumArtUri { get; set; } = UriExtensions.Localhost;
        public List<SongUpload> Songs { get; set; } = new List<SongUpload>();
        public Uri? PurchaseUrl { get; set; }
        public string Genres { get; set; } = string.Empty;
        public string ForeColor { get; set; } = string.Empty;
        public string BackColor { get; set; } = string.Empty;
        public string MutedColor { get; set; } = string.Empty;
        public string TextShadowColor { get; set; } = string.Empty;
    }
}
