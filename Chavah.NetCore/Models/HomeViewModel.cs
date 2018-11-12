namespace BitShuva.Chavah.Models
{
    public class HomeViewModel
    {
        /// <summary>
        /// The currently signed in user, or null if there is no user signed in.
        /// </summary>
        public UserViewModel User { get; set; }

        public Song Song { get; set; }
        public string SongNth { get; set; }

        /// <summary>
        /// Used for image descriptions on Index.cshtml
        /// </summary>
        public string DescriptiveImageUrl { get; set; }
    }
}