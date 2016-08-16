using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Models
{
    public class ChavahLog
    {
        public string Id { get; set; }
        public string Message { get; set; }
        public string Exception { get; set; }
        public DateTime DateTime { get; set; }
        public string Level { get; set; }
    }
}