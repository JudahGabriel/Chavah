using System;

namespace BitShuva.Chavah.Models
{
    public class Activity
    {
        public string Id { get; set; }
        public DateTimeOffset DateTime { get; set; }
        public string Description { get; set; }
        public string Title { get; set; }
        public Uri MoreInfoUri { get; set; }
        public ActivityType Type { get; set; }
        public string EntityId { get; set; }
    }
}