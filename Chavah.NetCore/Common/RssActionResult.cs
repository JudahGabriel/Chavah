using System.Threading.Tasks;
using System.Xml;

using BitShuva.Chavah.Models.Rss;

using Microsoft.AspNetCore.Mvc;
using Microsoft.SyndicationFeed;
using Microsoft.SyndicationFeed.Rss;

namespace Chavah.Common
{
    /// <summary>
    /// A RSS feed <see cref="ActionResult"/>.
    /// </summary>
    public class RssActionResult : ActionResult
    {
        private readonly SyndicationFeed feed;

        /// <summary>
        /// Creates a new feed action result.
        /// </summary>
        /// <param name="feed"></param>
        public RssActionResult(SyndicationFeed feed)
        {
            this.feed = feed;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void ExecuteResult(ActionContext context)
        {
            ExecuteResultAsync(context).GetAwaiter().GetResult();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public async override Task ExecuteResultAsync(ActionContext context)
        {
            context.HttpContext.Response.ContentType = "application/rss+xml";

            using var xmlWriter = XmlWriter.Create(context.HttpContext.Response.Body,
                                   new XmlWriterSettings() { Async = true, Indent = true });
            var writer = new RssFeedWriter(xmlWriter);

            await writer.WriteTitle(feed.Title);
            await writer.WriteDescription(feed.Description);
            await writer.Write(feed.Link);

            var languageElement = new SyndicationContent("language")
            {
                Value = feed.Language
            };
            await writer.Write(languageElement);

            foreach (var item in feed.Items)
            {
                await writer.Write(item);
            }
            await writer.WritePubDate(feed.LastUpdatedTime);
            await xmlWriter.FlushAsync();
        }
    }
}
