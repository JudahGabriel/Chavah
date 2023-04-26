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

        private const int maxProfilePictureSizeInBytes = 10_000_000;

        /// <summary>
        /// Creates a new instance.
        /// </summary>
        /// <param name="cdnManager"></param>
        /// <param name="dbSession"></param>
        /// <param name="logger"></param>
        public UsersController(
            ICdnManagerService cdnManager,
            IAsyncDocumentSession dbSession,
            ILogger<UsersController> logger)
            : base(dbSession, logger)
        {
            this.cdnManager = cdnManager;
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
                throw new ArgumentNullException(nameof(upload));
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

        /// <summary>
        /// Gets the profile picture for the user with the specified email address.
        /// </summary>
        /// <param name="email"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<Uri?> GetProfilePicForEmailAddress(string email)
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
            var user = await GetUserOrThrow();
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

        /// <summary>
        /// Gets the user registrations from the specified date until now.
        /// </summary>
        /// <param name="fromDate"></param>
        /// <returns></returns>
        [HttpGet]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<PagedList<AppUser>> GetRegistrations(DateTime fromDate)
        {
            var totalUsersCount = await DbSession.Query<AppUser>().CountAsync();
            var users = await DbSession.Query<AppUser>()
                .Where(u => u.RegistrationDate > fromDate)
                .OrderBy(u => u.RegistrationDate)
                .ToListAsync();
            return new PagedList<AppUser>
            {
                Items = users,
                Total = totalUsersCount
            };
        }

        /// <summary>
        /// Gets the unread notification count for the current user. If no user is logged in, 0 is returned.
        /// </summary>
        /// <returns>The number of unread notifications for the current user, or zero if the user is not signed in.</returns>
        [HttpGet]
        public async Task<int> GetUnreadNotificationsCount()
        {
            var user = await GetUser();
            return user?.Notifications.Count(n => n.IsUnread) ?? 0;
        }
    }
}
