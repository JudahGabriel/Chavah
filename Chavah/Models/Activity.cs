using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class Activity
    {
        public DateTime DateTime { get; set; }
        public string Description { get; set; }
        public string Title { get; set; }
        public Uri MoreInfoUri { get; set; }
    }
}