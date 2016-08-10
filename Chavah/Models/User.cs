using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class User
    {
        public User()
        {
            this.Preferences = new UserSongPreferences();
        }

        public string Id { get; set; }
        public int TotalPlays { get; set; }
        public UserSongPreferences Preferences { get; set; }
        public DateTime RegistrationDate { get; set; }
        public string EmailAddress { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime LastSeen { get; set; }
        public int TotalSongRequests { get; set; }

        public User Clone()
        {
            return new User
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
    }
}