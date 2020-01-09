using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Authorization;
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
        [Authorize(Roles = AppUser.AdminRole)]
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
        [Authorize]
        public async Task SaveVolume(double volume)
        {
            var user = await GetUser();
            if (user != null)
            {
                user.Volume = volume;
            }
        }

        /// <summary>
        /// Upload User Profile picture.
        /// </summary>
        /// <param name="upload"></param>
        /// <returns></returns>
        [HttpPost]
        [Authorize]
        public async Task<Uri> UploadProfilePicture([FromForm]ProfilePictureUpload upload)
        {
            if (upload.Photo == null)
            {
                throw new ArgumentNullException("file");
            }
            if (upload.Photo.Length > maxProfilePictureSizeInBytes)
            {
                throw new ArgumentException($"File is too large. Please upload files smaller than {maxProfilePictureSizeInBytes}")
                    .WithData("size", upload.Photo.Length);
            }

            var user = await GetUserOrThrow();

            //delete the old image
            if (user.ProfilePicUrl != null)
            {
                await cdnManager.DeleteProfilePicAsync(user);
            }

            using (var fileStream = upload.Photo.OpenReadStream())
            {
                user.ProfilePicUrl = await cdnManager.UploadProfilePicAsync(fileStream, upload.Photo.ContentType ?? "image/jpg");
            }

            return user.ProfilePicUrl;
        }

        [HttpGet]
        public async Task<Uri> GetProfilePicForEmailAddress(string email)
        {
            var user = await DbSession.LoadAsync<AppUser>(AppUser.AppUserPrefix + email);
            if (user != null)
            {
                return user.ProfilePicUrl;
            }

            return null;
        }

        /// <summary>
        /// Update User Profile.
        /// </summary>
        /// <param name="updatedUser"></param>
        /// <returns></returns>
        [HttpPost]
        [Authorize]
        public async Task<AppUser> UpdateProfile([FromBody]AppUser updatedUser)
        {
            var user = await GetUserOrThrow().ConfigureAwait(false);
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

        [HttpGet]
        [Authorize(Roles = AppUser.AdminRole)]
        public Task<List<AppUser>> GetNewUsers(int skip = 0, int take = 20)
        {
            return DbSession.Query<AppUser>()
                .OrderByDescending(u => u.RegistrationDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }
    }
}
