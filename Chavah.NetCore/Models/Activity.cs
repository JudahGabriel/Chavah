﻿using System;

namespace BitShuva.Chavah.Models
{
    public class Activity
    {
        public DateTime DateTime { get; set; }
        public string Description { get; set; }
        public string Title { get; set; }
        public Uri MoreInfoUri { get; set; }
    }
}