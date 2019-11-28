using System;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class CommentThread
    {
        public string Id { get; set; } = string.Empty;
        public string SongId { get; set; } = string.Empty;
        public List<Comment> Comments { get; set; } = new List<Comment>();
    }
}
