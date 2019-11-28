﻿using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Settings;

using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// View model for the home page.
    /// </summary>
    public class HomeViewModel
    {
        /// <summary>
        /// The currently signed in user, or null if there is no user signed in.
        /// </summary>
        public UserViewModel? User { get; set; }

        /// <summary>
        /// Gets the song initially requested via query string. This may be null if no song was requested.
        /// </summary>
        public Song? Song { get; set; }

        /// <summary>
        /// Gets the text describing the song number on the album, e.g. "9th"
        /// </summary>
        public string? SongNth { get; set; }

        /// <summary>
        /// The image to use for social media network previews of a Chavah link.
        /// </summary>
        public string? DescriptiveImageUrl { get; set; }

        /// <summary>
        /// Whether the app is running in debug mode.
        /// </summary>
#if DEBUG
        public bool Debug { get; set; } = true;
#else
        public bool Debug { get; set; } 
#endif

        /// <summary>
        /// The URL to redirect to. This may be null.
        /// </summary>
        public string? Redirect { get; set; }

        /// <summary>
        /// Whether the page is being loaded in an embedded iframe.
        /// </summary>
        public bool Embed { get; set; }

        /// <summary>
        /// The page title.
        /// </summary>
        public string PageTitle { get; set; } = string.Empty;

        /// <summary>
        /// Gets the page description.
        /// </summary>
        public string PageDescription { get; set; } = string.Empty;

        /// <summary>
        /// The list of cache-busted Angular views.
        /// </summary>
        public List<string> CacheBustedAngularViews { get; set; } = new List<string>();

        /// <summary>
        /// The default URL of the page.
        /// </summary>
        public string DefaultUrl { get; set; } = string.Empty;

        /// <summary>
        /// The CDN URL.
        /// </summary>
        public string CdnUrl { get; set; } = string.Empty;

        /// <summary>
        /// The sound effects list.
        /// </summary>
        public string SoundEffects { get; set; } = string.Empty;

        /// <summary>
        /// Gets whether Chavah is down for maintenance.
        /// </summary>
        public bool IsDownForMaintenance { get; set; }

        /// <summary>
        /// Gets the public key for Service Worker push notifications.
        /// </summary>
        public string PushNotificationsPublicKey { get; set; } = string.Empty;

        /// <summary>
        /// Gets the path to the service worker to use.
        /// </summary>
        public string ServiceWorker { get; set; } = string.Empty;

        /// <summary>
        /// The API key used for FilePickr.
        /// </summary>
        public string FilePickrKey { get; set; } = string.Empty;

        /// <summary>
        /// Converts the view model to a JSON object.
        /// </summary>
        /// <returns></returns>
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            });
        }

        public static HomeViewModel From(
            UserViewModel? user,
            Song? song,
            AppSettings appOptions,
            CdnSettings cdnOptions)
        {
            var vm = new HomeViewModel
            {
                PageTitle = appOptions.Title,
                PageDescription = appOptions.Description,
                DefaultUrl = appOptions.DefaultUrl,
                CdnUrl = cdnOptions.HttpPath,
                SoundEffects = new System.Uri(cdnOptions.HttpPath).Combine(cdnOptions.SoundEffects).ToString(),
                User = user,
                Song = song,
                IsDownForMaintenance = appOptions.IsDownForMaintenance,
                PushNotificationsPublicKey = appOptions.PushNotificationsPublicKey,
                FilePickrKey = appOptions.FilePickrKey
            };

            if (song != null)
            {
                vm.PageTitle = $"{song.Name} by {song.Artist} on {appOptions.Title}";
                vm.DescriptiveImageUrl = song.AlbumArtUri?.ToString();
                vm.Song = song;
                vm.SongNth = song.Number.ToNumberWord();
            }

            return vm;
        }
    }
}
