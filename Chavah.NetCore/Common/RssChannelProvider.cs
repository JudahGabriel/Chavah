using System;
using System.Threading;
using System.Threading.Tasks;

using cloudscribe.Syndication.Models.Rss;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// RSS chanel implementation. Aids us in generating RSS feeds as controller actions.
    /// </summary>
    public class RssChannelProvider : IChannelProvider
    {
        public string Name => "ChavahRssChannelProvider";

        // TODO: implement this. See https://github.com/joeaudette/cloudscribe.Syndication
        public Task<RssChannel> GetChannel(CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
