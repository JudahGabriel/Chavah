using System.Threading.Tasks;
using System.Xml;

using BitShuva.Chavah.Models.Rss;

using Microsoft.AspNetCore.Mvc;
using Microsoft.SyndicationFeed;
using Microsoft.SyndicationFeed.Rss;

namespace Chavah.Common
{
    public class RssActionResult : ActionResult
    {
        public SyndicationFeed Feed { get; set; }

        public RssActionResult(SyndicationFeed feed)
        {
            Feed = feed;
        }

        public override void ExecuteResult(ActionContext context)
        {
            ExecuteResultAsync(context).GetAwaiter().GetResult();
        }

        public async override Task ExecuteResultAsync(ActionContext context)
        {
            context.HttpContext.Response.ContentType = "application/rss+xml";

            using (var xmlWriter = XmlWriter.Create(context.HttpContext.Response.Body,
                                   new XmlWriterSettings() { Async = true, Indent = true }))
            {
                var writer = new RssFeedWriter(xmlWriter);

                await writer.WriteTitle(Feed.Title);
                await writer.WriteDescription(Feed.Description);
                await writer.Write(Feed.Link);

                var languageElement = new SyndicationContent("language")
                {
                    Value = Feed.Language
                };
                await writer.Write(languageElement);

                foreach (var item in Feed.Items)
                {
                    await writer.Write(item);
                }
                await writer.WritePubDate(Feed.LastUpdatedTime);
                await xmlWriter.FlushAsync();
            }
        }
    }
}
