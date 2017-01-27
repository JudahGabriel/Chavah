using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class AudioErrorInfo
    {
        public Html5MediaError? ErrorCode { get; set; }
        public string SongId { get; set; }
        public double? TrackPosition { get; set; }
        public string UserId { get; set; }
    }
}