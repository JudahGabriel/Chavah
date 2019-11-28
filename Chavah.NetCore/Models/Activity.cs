using System;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    public class Activity
    {
        public string Id { get; set; } = string.Empty;
        public DateTimeOffset DateTime { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public Uri MoreInfoUri { get; set; } = UriExtensions.Localhost;
        public ActivityType Type { get; set; }
        public string EntityId { get; set; } = string.Empty;
    }
}
