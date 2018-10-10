using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class UsersController : RavenController
    {
        private readonly ICdnManagerService cdnManager;
        private static readonly DateTime startTime = DateTime.UtcNow;

        public const int maxProfilePictureSizeInBytes = 10_000_000;

        public UsersController(
            ICdnManagerService cdnManager,
            IAsyncDocumentSession dbSession,
            ILogger<UsersController> logger)
            : base(dbSession, logger)
        {
            this.cdnManager = cdnManager;
        }

        [HttpGet]
        public async Task<RecentUserSummary> GetRecent(int minutes)
        {
            var recent = DateTime.UtcNow.Subtract(TimeSpan.FromMinutes(minutes));
            var loggedInUsers = await DbSession.Query<AppUser>()
                .Where(u => u.LastSeen >= recent)
                .Select(u => u.Email)
                .ToListAsync().ConfigureAwait(false);

            return new RecentUserSummary
            {
                Summary = $"{loggedInUsers.Count} logged in",
                LoggedIn = loggedInUsers,
                Anonymous = new List<string>(),
                Cookieless = new List<string>(),
                TotalSinceBeginning = loggedInUsers.Count,
                BeginningTime = DateTime.UtcNow.Subtract(startTime)
            };
        }

        /// <summary>
        /// Set volume for the logged in user.
        /// </summary>
        /// <param name="volume"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task SaveVolume(double volume)
        {
            // TODO: trace down the logic for the authentication. it should never be triggred from ui.
            var user = await GetCurrentUser().ConfigureAwait(false);
            if (user != null)
            {
                user.Volume = volume;
            }
        }

        /// <summary>
        /// Upload User Profile picture.
        /// </summary>
        /// <param name="file"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<Uri> UploadProfilePicture(IFormFile file)
        {
            if (file.Length > maxProfilePictureSizeInBytes)
            {
                throw new ArgumentException($"File is too large. Please upload files smaller than {maxProfilePictureSizeInBytes}")
                    .WithData("size", file.Length);
            }

            var user = await GetCurrentUserOrThrow().ConfigureAwait(false);
            var oldProfilePic = user.ProfilePicUrl;

            using (var fileStream = file.OpenReadStream())
            {
                user.ProfilePicUrl = await cdnManager.UploadProfilePicAsync(fileStream, file.ContentType ?? "image/jpg")
                    .ConfigureAwait(false);
            }
            
            //delete the old image
            await cdnManager.DeleteProfilePicAsync(oldProfilePic.OriginalString).ConfigureAwait(false);
            return user.ProfilePicUrl;
        }

        /// <summary>
        /// Update User Profile.
        /// </summary>
        /// <param name="updatedUser"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<AppUser> UpdateProfile([FromBody]AppUser updatedUser)
        {
            var user = await GetCurrentUserOrThrow().ConfigureAwait(false);
            var isUpdatingSelf = string.Equals(user.Email, updatedUser.Email, StringComparison.InvariantCultureIgnoreCase);
            if (!isUpdatingSelf)
            {
                throw new UnauthorizedAccessException("You can't update other people's profile")
                    .WithData("updatedUserEmail", updatedUser.Email)
                    .WithData("currentUserEmail", user.Email);
            }
            user.FirstName = updatedUser.FirstName;
            user.LastName = updatedUser.LastName;

            return user;
        }
    }
}