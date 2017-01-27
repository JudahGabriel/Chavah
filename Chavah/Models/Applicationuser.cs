using Microsoft.AspNet.Identity;
using RavenDB.AspNet.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Models
{
    /// <summary>
    /// The new user class, used with ASP.NET Identity. Meant to supplant the old User class used with Mozilla Persona.
    /// </summary>
    public class ApplicationUser : IdentityUser
    {
        public const string AdminRole = "Admin";

        public ApplicationUser()
        {
            this.Preferences = new UserSongPreferences();
        }
        
        public int TotalPlays { get; set; }
        public UserSongPreferences Preferences { get; set; }
        public DateTime RegistrationDate { get; set; }
        public DateTime LastSeen { get; set; }
        public int TotalSongRequests { get; set; }
        public bool RequiresPasswordReset { get; set; }
        public List<string> RecentSongIds { get; set; } = new List<string>();
        public string Jwt { get; set; }

        public ApplicationUser Clone()
        {
            return new ApplicationUser
            {
                Id = this.Id,
                LastSeen = this.LastSeen,
                Preferences = this.Preferences,
                TotalSongRequests = this.TotalSongRequests,
                RegistrationDate = this.RegistrationDate,
                RequiresPasswordReset = this.RequiresPasswordReset,
                TotalPlays = this.TotalPlays,
                Email = this.Email,
                UserName = this.UserName,
                LockoutEnabled = this.LockoutEnabled
            };
        }

        public bool IsAdmin() => this.Roles.Contains(ApplicationUser.AdminRole);

        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser> manager)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, DefaultAuthenticationTypes.ApplicationCookie);
            // Add custom user claims here
            return userIdentity;
        }
    }
}