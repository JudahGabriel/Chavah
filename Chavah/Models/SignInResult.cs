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
    }
}