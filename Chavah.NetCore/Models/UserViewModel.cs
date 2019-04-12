using System;
using System.Collections.Generic;

using Raven.Identity;

namespace BitShuva.Chavah.Models
{
    public class UserViewModel
    {
        #region AppUser.cs
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
        public double Volume { get; set; }

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
        #endregion

        /// <summary>
        /// Number of times sign in failed.
        /// </summary>
        public int AccessFailedCount { get; set; }

        /// <summary>
        /// The user's claims, for use in claims-based authentication.
        /// </summary>
        public List<IdentityUserClaim> Claims { get; set; }

        /// <summary>
        /// The email of the user.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// The ID of the user.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// The user name. Usually the same as the email.
        /// </summary>
        public string UserName { get; set; }

        /// <summary>
        /// Whether the user has confirmed their email address.
        /// </summary>
        public bool EmailConfirmed { get; set; }

        /// <summary>
        /// Whether the user has confirmed their phone.
        /// </summary>
        public bool IsPhoneNumberConfirmed { get; set; }

        /// <summary>
        /// Whether the user is locked out.
        /// </summary>
        public bool LockoutEnabled { get; set; }

        /// <summary>
        /// Whether the user is locked out.
        /// </summary>
        public DateTimeOffset? LockoutEndDate { get; set; }

        /// <summary>
        /// Whether 2-factor authentication is enabled.
        /// </summary>
        public bool TwoFactorEnabled { get; set; }

        /// <summary>
        /// The phone number.
        /// </summary>
        public string PhoneNumber { get; set; }

        /// <summary>
        ///  The roles of the user.
        /// </summary>
        public IList<string> Roles { get; set; }
    }
}
