using BitShuva.Chavah.Common;
using Microsoft.SyndicationFeed;
using Microsoft.SyndicationFeed.Rss;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Xml;

namespace BitShuva.Chavah.Models.Rss
{
    public class SyndicationFeed
    {
        private string v1;
        private string v2;
        private Uri uri;
        private string v3;
        private List<SyndicationLinkItem> rssItems;

        public SyndicationFeed(string v1, string v2, Uri uri, string v3, List<SyndicationLinkItem> rssItems)
        {
            this.v1 = v1;
            this.v2 = v2;
            this.uri = uri;
            this.v3 = v3;
            this.rssItems = rssItems;
        }

        public SyndicationFeed(
            string title,
            string description,
            Uri feedAlternateLink,
            string id,
            IEnumerable<SyndicationItem> items,
            string language)
        {
            Title = title;
            Description = description;
            Link = new SyndicationLink(feedAlternateLink);
            Id = id;
            Items = items;
            LastUpdatedTime = DateTimeOffset.UtcNow;
            Language = language;
        }

        public string Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Language { get;}

        public SyndicationLink Link { get; set; }
        public IEnumerable<SyndicationItem> Items { get; set; }

        public DateTimeOffset LastUpdatedTime { get; set; }

        public async Task<MemoryStream> Write()
        {
            var sw = new MemoryStream();

            using (XmlWriter xmlWriter = XmlWriter.Create(sw,
                                   new XmlWriterSettings() { Async = true, Indent = true }))
            {
                var writer = new RssFeedWriter(xmlWriter);

                await writer.WriteTitle(this.Title);
                await writer.WriteDescription(this.Description);
                await writer.Write(this.Link);

                var languageElement = new SyndicationContent("language");
                languageElement.Value = Language;
                await writer.Write(languageElement);

                foreach (var item in Items)
                {
                    await writer.Write(item);
                }
                await writer.WritePubDate(this.LastUpdatedTime);
                await xmlWriter.FlushAsync();
            }

            return sw;
        }
    }
}
