using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class SignInResult
    {
        public SignInStatus Status { get; set; }
        public string ErrorMessage { get; set; }

        /// <summary>
        /// Gets the JSON web token generated upon successful sign in. This will be null otherwise.
        /// </summary>
        public string JsonWebToken { get; set; }

        public string Email { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }
}