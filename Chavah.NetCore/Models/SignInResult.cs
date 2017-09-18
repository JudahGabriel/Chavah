using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class SignInResult
    {
        public SignInStatus Status { get; set; }
        public string ErrorMessage { get; set; }
        public string Email { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }
}