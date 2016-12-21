using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class AlbumDupe
    {
        public string Name { get; set; }
        public List<string> AlbumIds { get; set; }
        public int Count { get; set; }
    }
}