using System;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    public class SongUpload
    {
        public Uri Address { get; set; } = UriExtensions.Localhost;
        public string FileName { get; set; } = string.Empty;
    }
}
