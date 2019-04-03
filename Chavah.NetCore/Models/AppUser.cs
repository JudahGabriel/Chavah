using Raven.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A user registered with Chavah.
    /// </summary>
    public class AppUser : IdentityUser
    {
        public const string AppUserPrefix = "AppUsers/";
        public const string AdminRole = "admin";
        public const int MaxNotifications = 5;
        public const int MaxRecentSongs = 10;
        
        /// <summary>
        /// Gets the total number of songs played by this user.
        /// </summary>
        public int TotalPlays { get; set; }

        /// <summary>
        /// Gets the date the user registered.
        /// </summary>
        public DateTime RegistrationDate { get; set; }

        /// <summary>
        /// Gets the last time we saw this user.
        /// </summary>
        public DateTime LastSeen { get; set; }

        /// <summary>
        /// Gets the total number of song requests made by this user.
        /// </summary>
        public int TotalSongRequests { get; set; }

        /// <summary>
        /// Whether this user requires a password reset.
        /// </summary>
        public bool RequiresPasswordReset { get; set; }

        /// <summary>
        /// Gets the IDs of the most recent songs played by the user.
        /// </summary>
        public List<string> RecentSongIds { get; set; } = new List<string>();

        /// <summary>
        /// Gets the list of notifications for the user.
        /// </summary>
        public List<Notification> Notifications { get; set; } = new List<Notification>();
        
        /// <summary>
        /// The last set volume, from 0 (muted) to 1 (full volume).
        /// </summary>
        public double Volume { get; set; } = 1;

        /// <summary>
        /// Gets the URL for the user's profile picture. Will be null if the user doesn't have a profile pic setup.
        /// </summary>
        public Uri ProfilePicUrl { get; set; }
        
        /// <summary>
        /// The user's first name.
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        /// The user's last name.
        /// </summary>
        public string LastName { get; set; }

        public void AddNotification(Notification notification)
        {
            this.Notifications.Insert(0, notification);
            if (this.Notifications.Count > MaxNotifications)
            {
                this.Notifications.RemoveAt(MaxNotifications);
            }
        }

        public void AddRecentSong(string songId)
        {
            this.RecentSongIds.Insert(0, songId);
            if (this.RecentSongIds.Count > MaxRecentSongs)
            {
                this.RecentSongIds.RemoveAt(MaxRecentSongs);
            }
        }

        public AppUser Clone()
        {
            return new AppUser
            {
                Id = this.Id,
                LastSeen = this.LastSeen,
                TotalSongRequests = this.TotalSongRequests,
                RegistrationDate = this.RegistrationDate,
                RequiresPasswordReset = this.RequiresPasswordReset,
                TotalPlays = this.TotalPlays,
                Email = this.Email,
                UserName = this.UserName,
                LockoutEnabled = this.LockoutEnabled
            };
        }

        public bool IsAdmin() => this.Roles.Contains(AppUser.AdminRole);
    }
}
