using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class Artist
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<string> Images { get; set; } = new List<string>();
        public string? Bio { get; set; }
        public List<Donation> Donations { get; set; } = new List<Donation>();
    }
}
