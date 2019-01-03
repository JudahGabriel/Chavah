using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// Contains a list of email domains used for throwaway/temporary email accounts. 
    /// </summary>
    /// <remarks>
    /// List of domains fetched from https://github.com/martenson/disposable-email-domains/blob/master/disposable_email_blocklist.conf
    /// </remarks>
    public class ThrowawayEmailDomains
    {
        public List<string> Domains { get; set; } = new List<string>();
    }
}
