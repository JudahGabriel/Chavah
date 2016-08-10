using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class AlbumUpload
    {
        public string Name { get; set; }
        public string Artist { get; set; }
        public string AlbumArtUri { get; set; }
        public List<SongUpload> Songs { get; set; }
        public string PurchaseUrl { get; set; }
        public string Genres { get; set; }
        public string ForeColor { get; set; }
        public string BackColor { get; set; }
        public string MutedColor { get; set; }
        public string TextShadowColor { get; set; }
    }
}