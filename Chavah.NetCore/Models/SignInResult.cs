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
        public AppUser User { get; set; }
    }
}