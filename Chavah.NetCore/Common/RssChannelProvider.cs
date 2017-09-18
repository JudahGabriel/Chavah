using cloudscribe.Syndication.Models.Rss;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// RSS chanel implementation. Aids us in generating RSS feeds as controller actions.
    /// </summary>
    public class RssChannelProvider : IChannelProvider
    {
        public string Name => "ChavahRssChannelProvider";

        // TODO: implement this. See https://github.com/joeaudette/cloudscribe.Syndication
        public Task<RssChannel> GetChannel(CancellationToken cancellationToken = default(CancellationToken))
        {
            throw new NotImplementedException();
        }
    }
}
