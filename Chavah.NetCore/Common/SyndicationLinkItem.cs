using System;

using Microsoft.SyndicationFeed;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// Syndication item that is initialized with a link.
    /// </summary>
    public class SyndicationLinkItem : SyndicationItem
    {
        public SyndicationLinkItem(string id, string title, string description, Uri link)
        {
            Id = id;
            Title = title;
            Description = description;
            AddLink(new SyndicationLink(link));
        }
    }
}
