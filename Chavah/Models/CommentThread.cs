using System;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class CommentThread
    {
        public string? Id { get; set; }
        public string SongId { get; set; } = string.Empty;
        public List<Comment> Comments { get; set; } = new List<Comment>();
    }
}
