using System;
using System.Linq;

namespace BitShuva.Chavah.Models
{
    public class Comment
    {
        public string UserId { get; set; }
        public string UserDisplayName { get; set; }
        public string Content { get; set; }
        public DateTimeOffset Date { get; set; }
        public int FlagCount { get; set; }
        public DateTimeOffset? LastFlagDate { get; set; }

        public static string GetUserDisplayName(AppUser user)
        {
            // Use the First and Last name if we have it.
            if (!string.IsNullOrWhiteSpace(user.FirstName) && !string.IsNullOrWhiteSpace(user.LastName))
            {
                return user.FirstName + " " + user.LastName;
            }

            // "AppUsers/yochanansheqel@gmail.com" -> "yochanansheqel"
            var domainIndex = user.Id.LastIndexOf('@');
            var userIdPrefixLength = AppUser.AppUserPrefix.Length;
            if (domainIndex > userIdPrefixLength)
            {
                return user.Id.Substring(userIdPrefixLength, domainIndex - userIdPrefixLength);
            }

            return user.Id;
        }
    }
}
