using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class CommentThread
    {
        public string Id => "CommentThread/" + SongId;
        public string SongId { get; set; }
        public List<Comment> Comments { get; set; } = new List<Comment>();
    }
}