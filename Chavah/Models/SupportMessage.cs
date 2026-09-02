using System;

namespace BitShuva.Chavah.Models
{
    public class SupportMessage
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? UserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string? UserAgent { get; set; }
    }
}
