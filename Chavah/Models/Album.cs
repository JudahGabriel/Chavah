using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

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
    }
}