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
        public ApplicationUser()
        {
            this.Preferences = new UserSongPreferences();
        }
        
        public int TotalPlays { get; set; }
        public UserSongPreferences Preferences { get; set; }
        public DateTime RegistrationDate { get; set; }
        public string EmailAddress { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime LastSeen { get; set; }
        public int TotalSongRequests { get; set; }

        public ApplicationUser Clone()
        {
            return new ApplicationUser
            {
                Id = this.Id,
                EmailAddress = this.EmailAddress,
                IsAdmin = this.IsAdmin,
                LastSeen = this.LastSeen,
                Preferences = this.Preferences,
                RegistrationDate = this.RegistrationDate,
                TotalPlays = this.TotalPlays
            };
        }

        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser> manager)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, DefaultAuthenticationTypes.ApplicationCookie);
            // Add custom user claims here
            return userIdentity;
        }
    }
}