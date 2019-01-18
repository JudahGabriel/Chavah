using BitShuva.Chavah.Common;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// View model for the home page.
    /// </summary>
    public class HomeViewModel
    {
        public HomeViewModel()
        {
#if DEBUG
            this.Debug = true;
#endif
        }
        
        /// <summary>
        /// The currently signed in user, or null if there is no user signed in.
        /// </summary>
        public UserViewModel User { get; set; }

        /// <summary>
        /// Gets the song initially requested via query string. This may be null if no song was requested.
        /// </summary>
        public Song Song { get; set; }

        /// <summary>
        /// Gets the text describing the song number on the album, e.g. "9th"
        /// </summary>
        public string SongNth { get; set; }

        /// <summary>
        /// Used for image descriptions on Index.cshtml
        /// </summary>
        public string DescriptiveImageUrl { get; set; }

        /// <summary>
        /// Whether the app is running in debug mode.
        /// </summary>
        public bool Debug { get; set; }

        /// <summary>
        /// The URL to redirect to. This may be null.
        /// </summary>
        public string Redirect { get; set; }

        /// <summary>
        /// Whether the page is being loaded in an embedded iframe.
        /// </summary>
        public bool Embed { get; set; }

        /// <summary>
        /// The page title.
        /// </summary>
        public string PageTitle { get; set; }

        /// <summary>
        /// Gets the page description.
        /// </summary>
        public string PageDescription { get; set; }

        /// <summary>
        /// The list of cache-busted Angular views.
        /// </summary>
        public IList<string> CacheBustedAngularViews { get; set; }

        /// <summary>
        /// The default URL of the page.
        /// </summary>
        public string DefaultUrl { get; set; }

        /// <summary>
        /// The CDN URL.
        /// </summary>
        public string CdnUrl { get; set; }

        /// <summary>
        /// The sound effects list.
        /// </summary>
        public string SoundEffects { get; set; }

        /// <summary>
        /// Gets whether Chavah is down for maintenance.
        /// </summary>
        public bool IsDownForMaintenance { get; set; }

        /// <summary>
        /// Gets the public key for Service Worker push notifications.
        /// </summary>
        public string PushNotificationsPublicKey { get; set; }

        /// <summary>
        /// Gets the path to the service worker to use.
        /// </summary>
        public string ServiceWorker { get; set; }

        /// <summary>
        /// Converts the view model to a JSON object.
        /// </summary>
        /// <returns></returns>
        public string ToJson()
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this, new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            });
        }

        public static HomeViewModel From(UserViewModel user, Song song, Application appSettings, Cdn cdnSettings)
        {
            var vm = new HomeViewModel
            {
                PageTitle = appSettings.Title,
                PageDescription = appSettings.Description,
                DefaultUrl = appSettings.DefaultUrl,
                CdnUrl = cdnSettings.HttpPath,
                SoundEffects = new System.Uri(cdnSettings.HttpPath).Combine(cdnSettings.SoundEffects).ToString(),
                User = user,
                Song = song,
                IsDownForMaintenance = appSettings.IsDownForMaintenance,
                PushNotificationsPublicKey = appSettings.PushNotificationsPublicKey
                ServiceWorker = appSettings.ServiceWorker
            };
            
            if (song != null)
            {
                vm.PageTitle = $"{song.Name} by {song.Artist} on {appSettings.Title}";
                vm.DescriptiveImageUrl = song.AlbumArtUri?.ToString();
                vm.Song = song;
                vm.SongNth = song.Number.ToNumberWord();
            }

            return vm;
        }
    }
}