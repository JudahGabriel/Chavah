using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    public class CdnSettings
    {
        public string FtpHost { get; set; }
        public string FtpUserName { get; set; } 
        public string FtpPassword { get; set; } 
        public string FtpWorkingDirectory { get; set; }
        public string MusicDirectory { get; set; }
        public string AlbumArtDirectory { get; set; }
        public string ArtistImagesDirectory { get; set; }
        public string HttpPath { get; set; }
    }
}
