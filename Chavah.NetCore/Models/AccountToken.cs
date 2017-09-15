using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class AccountToken
    {
        public string Id { get; set; }
        public string Token { get; set; }
        public string ApplicationUserId { get; set; }
    }
}