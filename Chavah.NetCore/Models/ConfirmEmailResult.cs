using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class ConfirmEmailResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
    }
}