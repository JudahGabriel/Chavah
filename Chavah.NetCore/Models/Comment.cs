using System;

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

        public static string GetUserDisplayNameFromId(string userId)
        {
            // "AppUsers/yochanansheqel@gmail.com" -> "yochanansheqel"
            var domainIndex = userId.LastIndexOf('@');
            var userIdPrefixLength = AppUser.AppUserPrefix.Length;
            if (domainIndex > userIdPrefixLength)
            {
                return userId.Substring(userIdPrefixLength, domainIndex - userIdPrefixLength);
            }

            return userId;
        }
    }
}
