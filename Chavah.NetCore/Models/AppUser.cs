using RavenDB.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A user registered with Chavah.
    /// </summary>
    public class AppUser : IdentityUser
    {
        public const string AdminRole = "admin";
        public const int MaxNotifications = 5;
        public const int MaxRecentSongs = 10;

        public AppUser()
        {
        }

        public int TotalPlays { get; set; }
        public DateTime RegistrationDate { get; set; }
        public DateTime LastSeen { get; set; }
        public int TotalSongRequests { get; set; }
        public bool RequiresPasswordReset { get; set; }
        public List<string> RecentSongIds { get; set; } = new List<string>();
        //public string Jwt { get; set; }
        public List<Notification> Notifications { get; set; } = new List<Notification>();

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
