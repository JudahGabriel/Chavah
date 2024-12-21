using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using BitShuva.Chavah.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class CdnController : RavenController
    {
        private readonly ICdnManagerService cdnManager;
        private readonly IOptions<CdnSettings> cdnSettings;

        public CdnController(
            ICdnManagerService cdnManager,
            IOptions<CdnSettings> cdnSettings,
            IAsyncDocumentSession dbSession,
            ILogger<CdnController> logger)
            : base(dbSession, logger)
        {
            this.cdnManager = cdnManager;
            this.cdnSettings = cdnSettings;
        }

        [Authorize(Roles = AppUser.AdminRole)]
        [HttpGet]
        public async Task<List<string>> ValidateSongCdnLinks()
        {
            // Find all song CDN URLs.
            var invalidSongUris = new HashSet<string>(5000, StringComparer.InvariantCultureIgnoreCase);
            var songEnumerator = await DbSession.Advanced.StreamAsync<Song>("songs/");
            while (await songEnumerator.MoveNextAsync())
            {
                var songUri = songEnumerator.Current.Document.Uri?.ToString();
                if (!string.IsNullOrEmpty(songUri))
                {
                    invalidSongUris.Add(songUri);
                }
            }

            // Find all the artist directories in the music directory. 
            var musicDir = cdnSettings.Value.MusicDirectory;
            var artistDirectories = await cdnManager.GetDirectories(musicDir);
            foreach (var artistDir in artistDirectories)
            {
                var files = await cdnManager.GetFiles($"{musicDir}/{artistDir}");
                foreach (var file in files)
                {
                    var mp3Uri = $"{cdnSettings.Value.HttpPath}/{musicDir}/{artistDir}/{file}";

                    // Since it exists on the CDN, remove it from the invalid Song URIs list.
                    invalidSongUris.Remove(mp3Uri);
                }
            }

            return invalidSongUris.ToList();
        }

        /// <summary>
        /// Redirects to a random station identifier MP3 on the CDN.
        /// </summary>
        /// <returns></returns>
        [Obsolete("Not used due to issues with native iOS audio redirects. Avoid using redirects.")]
        public RedirectResult GetStationId()
        {
            var directory = new Uri(cdnSettings.Value.HttpPath).Combine(cdnSettings.Value.SoundEffects);
            var idAnnouncement = new Random().Next(1, 12);
            return Redirect(directory.Combine($"StationId{idAnnouncement}.mp3").AbsoluteUri);
        }

        /// <summary>
        /// Redirects to the MP3 audio file of a random Chavah ad.
        /// </summary>
        /// <returns></returns>
        [Obsolete("Not used due to issues with native iOS audio redirects. Avoid using redirects.")]
        public RedirectResult GetAdAnnouncement()
        {
            // var sukkotAd = "sukkot2024.mp3";
            var ads = new[]
            {
                // sukkotAd,
                "ad1x.mp3",
                "ad2x.mp3",
                "ad3x.mp3",
                "ad4x.mp3",
                "ad5x.mp3"
            };

            // Sukkot 2024 ad: play it every even hour.
            //var fileName = DateTime.UtcNow.Hour % 2 == 0 ? sukkotAd : ads.RandomElement()!;
            var fileName = ads.RandomElement();
            var directory = new Uri(cdnSettings.Value.HttpPath).Combine(cdnSettings.Value.SoundEffects);
            return Redirect(directory.Combine(fileName!).AbsoluteUri);
        }

        /// <summary>
        /// Redirects to the MP3 audio file of a random "next up is a new song" announcement.
        /// </summary>
        /// <returns></returns>
        [Obsolete("Not used due to issues with native iOS audio redirects. Avoid using redirects.")]
        public RedirectResult GetNewMusicAnnouncement()
        {
            var newMusicAnnouncements = new[]
            {
                "new-music-1.mp3",
                "new-music-2.mp3",
                "new-music-3.mp3",
                "new-music-4.mp3",
                "new-music-5.mp3",
                "new-music-6.mp3",
            };

            var fileName = newMusicAnnouncements.RandomElement()!;
            var directory = new Uri(cdnSettings.Value.HttpPath).Combine(cdnSettings.Value.SoundEffects);
            return Redirect(directory.Combine(fileName).AbsoluteUri);
        }

        /// <summary>
        /// Redirects to the profile picture of the user with the specified ID. If it doesn't exist, 
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        public async Task<RedirectResult> GetUserProfile(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Redirect(DefaultProfilePic.ToString());
            }

            var user = await DbSession.LoadOptionalAsync<AppUser>(userId);
            var profilePic = user?.ProfilePicUrl ?? DefaultProfilePic;
            return Redirect(profilePic.ToString());
        }

        private Uri DefaultProfilePic => new Uri(cdnSettings.Value.HttpPath)
            .Combine(cdnSettings.Value.ProfilePicsDirectory)
            .Combine("unknown-user.jpg");
    }
}
