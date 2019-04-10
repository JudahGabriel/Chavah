using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class Artist
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public List<string> Images { get; set; } = new List<string>();
        public string Bio { get; set; }
    }
}
