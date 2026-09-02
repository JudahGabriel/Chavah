using System;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class SongRequest
    {
        public string? Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string SongId { get; set; } = string.Empty;
        public DateTime DateTime { get; set; }
        public List<string> PlayedForUserIds { get; set; } = new List<string>();
        public string Name { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
    }
}
