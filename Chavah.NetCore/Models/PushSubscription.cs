using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// An HTML5 service worker push subscription.
    /// </summary>
    /// <see cref="https://www.tpeczek.com/2017/12/push-notifications-and-aspnet-core-part.html"/>
    public class PushSubscription
    {
        public string Endpoint { get; set; }
        public IDictionary<string, string> Keys { get; set; }
    }
}
