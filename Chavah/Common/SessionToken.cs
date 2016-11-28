using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Web;

namespace BitShuva.Common
{
    public class SessionToken
    {
        public SessionToken()
        {
        }

        public SessionToken(ClaimsPrincipal claimsPrincipal)
        {
            Email = claimsPrincipal.Claims.Where(c => c.Type == "Email").Select(c => c.Value).FirstOrDefault() ?? "";
            IsSignedIn = !string.IsNullOrEmpty(Email);
            IsAdmin = claimsPrincipal.Claims.Where(c => c.Type == "IsAdmin").Select(s => s.Value).FirstOrDefault() == bool.TrueString;
        }

        public bool IsSignedIn { get; set; }
        public bool IsAdmin { get; set; }
        public string Email { get; set; }
        public string UserId => "ApplicationUsers/" + Email;
    }
}