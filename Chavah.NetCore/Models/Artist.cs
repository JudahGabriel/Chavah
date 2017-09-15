using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class Artist
    {
        public Artist()
        {
            this.Images = new List<string>();
        }

        public string Id { get; set; }
        public string Name { get; set; }
        public List<string> Images { get; set; }
        public string Bio { get; set; }
    }
}