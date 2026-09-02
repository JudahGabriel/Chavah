using System;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class RecentUserSummary
    {
        public string Summary { get; set; } = string.Empty;
        public List<string> LoggedIn { get; set; } = new List<string>();
        public List<string> Anonymous { get; set; } = new List<string>();
        public List<string> Cookieless { get; set; } = new List<string>();
        public int TotalSinceBeginning { get; set; }
        public TimeSpan BeginningTime { get; set; }
    }
}
