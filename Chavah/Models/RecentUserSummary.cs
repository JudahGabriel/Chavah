using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class RecentUserSummary
    {
        public string Summary { get; set; }
        public IList<string> LoggedIn { get; set; }
        public IList<string> Anonymous { get; set; }
        public IList<string> Cookieless { get; set; }
        public int TotalSinceBeginning { get; set; }
        public TimeSpan BeginningTime { get; set; }
    }
}