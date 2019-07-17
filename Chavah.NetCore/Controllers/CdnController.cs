using System;
using System.Collections.Generic;
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
                invalidSongUris.Add(songEnumerator.Current.Document.Uri?.ToString());
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
        public RedirectResult GetStationId()
        {
            var directory = new Uri(cdnSettings.Value.HttpPath).Combine(cdnSettings.Value.SoundEffects);
            var idAnnouncement = new Random().Next(1, 9);
            return Redirect(directory.Combine($"StationId{idAnnouncement}.mp3").AbsoluteUri);
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

            var user = await DbSession.LoadOptionAsync<AppUser>(userId);
            var profilePic = user
                .Map(u => u.ProfilePicUrl)
                .NotNull()
                .ValueOr(() => DefaultProfilePic);
            return Redirect(profilePic.ToString());
        }

        private Uri DefaultProfilePic => new Uri(cdnSettings.Value.HttpPath)
            .Combine(cdnSettings.Value.ProfilePicsDirectory)
            .Combine("unknown-user.jpg");
    }
}
