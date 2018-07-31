using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class UsersController : RavenController
    {
        private ICdnManagerService cdnManager;

        public const int maxProfilePictureSizeInBytes = 10_000_000;
        private static readonly DateTime startTime = DateTime.UtcNow;

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
                .ToListAsync();
            
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

        [HttpPost]
        public async Task SaveVolume(double volume)
        {
            var user = await this.GetCurrentUserOrThrow();
            user.Volume = volume;
        }

        [HttpPost]
        public async Task<Uri> UploadProfilePicture(IFormFile file)
        {
            if (file.Length > maxProfilePictureSizeInBytes)
            {
                throw new ArgumentException($"File is too large. Please upload files smaller than {maxProfilePictureSizeInBytes}")
                    .WithData("size", file.Length);
            }

            var user = await this.GetCurrentUserOrThrow();
            using (var fileStream = file.OpenReadStream())
            {
                var profilePicUrl = await cdnManager.UploadProfilePicAsync(fileStream, file.ContentType ?? "image/jpg");
                user.ProfilePicUrl = profilePicUrl;
            }

            // TODO: We may want to delete the old profile pic.

            return user.ProfilePicUrl;
        }

        [HttpPost]
        public async Task<AppUser> UpdateProfile([FromBody]AppUser updatedUser)
        {
            var user = await this.GetCurrentUserOrThrow();
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