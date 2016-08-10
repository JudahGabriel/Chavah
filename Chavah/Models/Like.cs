using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class Like
    {
        public string UserId { get; set; }
        public string SongId { get; set; }
        public DateTime Date { get; set; }
        public LikeStatus Status { get; set; }
    }
}