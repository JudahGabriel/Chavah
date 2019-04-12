using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Xml;

using Microsoft.SyndicationFeed;
using Microsoft.SyndicationFeed.Rss;

namespace BitShuva.Chavah.Models.Rss
{
    public class SyndicationFeed
    {
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

            using (var xmlWriter = XmlWriter.Create(sw,
                                   new XmlWriterSettings() { Async = true, Indent = true }))
            {
                var writer = new RssFeedWriter(xmlWriter);

                await writer.WriteTitle(Title);
                await writer.WriteDescription(Description);
                await writer.Write(Link);

                var languageElement = new SyndicationContent("language")
                {
                    Value = Language
                };
                await writer.Write(languageElement);

                foreach (var item in Items)
                {
                    await writer.Write(item);
                }
                await writer.WritePubDate(LastUpdatedTime);
                await xmlWriter.FlushAsync();
            }

            return sw;
        }
    }
}
