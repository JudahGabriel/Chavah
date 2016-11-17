using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class UserDupe
    {
        public string EmailAddress { get; set; }
        public List<string> UserIds { get; set; }
        public int Count { get; set; }
        public DateTime LastSeen { get; set; }
    }
}