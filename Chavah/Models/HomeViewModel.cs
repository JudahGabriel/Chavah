using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class HomeViewModel
    {
        public HomeViewModel()
        {
#if DEBUG
            Debug = true;
#endif
        }

        public string UserEmail { get; set; }
        public List<string> UserRoles { get; set; } = new List<string>();
        public bool Debug { get; set; }
        public string Redirect { get; set; }
        public bool Embed { get; set; }
        public string PageTitle { get; set; }
        public string DescriptiveImageUrl { get; set; }
        public Song Song { get; set; }
        public string SongNth { get; set; }
    }
}