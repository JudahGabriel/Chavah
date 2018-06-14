using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class Comment
    {
        public string UserId { get; set; }
        public string Content { get; set; }
        public DateTimeOffset Date { get; set; }
        public int FlagCount { get; set; }
        public DateTimeOffset? LastFlagDate { get; set; }
    }
}