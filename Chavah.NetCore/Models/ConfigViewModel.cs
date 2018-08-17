using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class ConfigViewModel
    {
        public ConfigViewModel()
        {
#if DEBUG
            Debug = true;
#endif
        }

        /// <summary>
        /// The currently signed in user, or null if there is no user signed in.
        /// </summary>
        public UserViewModel User { get; set; }
        public bool Debug { get; set; }
        public string Redirect { get; set; }
        public bool Embed { get; set; }
        public string PageTitle { get; set; }
        public string PageDescription { get; set; }
        public string DescriptiveImageUrl { get; set; }
        public Song Song { get; set; }
        public string SongNth { get; set; }
        public IList<string> CacheBustedAngularViews { get; set; }

        public string DefaultUrl { get; set; }
        public string CdnUrl { get; set; }

        public string SoundEffects { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
    }
}
