using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class SignInResult
    {
        public SignInStatus status { get; set; }
        public string errorMessage { get; set; }

        /// <summary>
        /// Gets the JSON web token generated upon successful sign in. This will be null otherwise.
        /// </summary>
        public string jsonWebToken { get; set; }

        public string email { get; set; }
        public List<string> roles { get; set; } = new List<string>();
    }
}