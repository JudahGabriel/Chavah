﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class ResetPasswordResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public bool InvalidEmail { get; set; }
    }
}