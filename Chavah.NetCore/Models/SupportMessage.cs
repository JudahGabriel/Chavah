using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    public class SupportMessage
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string UserId { get; set; }
        public string Message { get; set; }
        public DateTime Date { get; set; }
    }
}
