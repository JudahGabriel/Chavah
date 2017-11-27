using Microsoft.SyndicationFeed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// Syndication item that is initialized with a link.
    /// </summary>
    public class SyndicationLinkItem : SyndicationItem
    {
        public SyndicationLinkItem(string id, string title, string description, Uri link)
        {
            this.Id = id;
            this.Title = title;
            this.Description = description;
            this.AddLink(new SyndicationLink(link));
        }
    }
}
