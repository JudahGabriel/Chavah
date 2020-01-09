using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// An email that is muted; users who contact Chavah via this email won't have their emails actually sent to Chavah.
    /// </summary>
    public class MutedEmail
    {
        public string? Id { get; set; }
        public string Email { get; set; } = string.Empty;
    }
}
