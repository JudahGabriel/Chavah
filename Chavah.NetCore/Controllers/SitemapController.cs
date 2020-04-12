using System;
using System.Collections.Generic;
using System.Linq;
using System.Reactive.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;

using SimpleSiteMap;

namespace BitShuva.Chavah.Controllers
{
    public class SitemapController : RavenController
    {
        public SitemapController(
            IAsyncDocumentSession dbSession,
            ILogger<SitemapController> logger)
            : base(dbSession, logger)
        {
        }

        [HttpGet]
        [Route("sitemap")]
        public async Task<IActionResult> Index()
        {
            var sitemapItems = await GetSongsAsSitemapItems();

            // Add site map for home and public nav pages.
            // TODO: Modified date for nav pages - what do we say?
            var navPageModifiedDate = new DateTime(2018, 11, 13);
            sitemapItems.AddRange(new[]
            {
                new SitemapNode(new Uri("https://messianicradio.com"), navPageModifiedDate, SitemapFrequency.Monthly),
                new SitemapNode(new Uri("https://messianicradio.com/#/trending"), DateTime.Today, SitemapFrequency.Daily),
                new SitemapNode(new Uri("https://messianicradio.com/#/support"), navPageModifiedDate, SitemapFrequency.Yearly),
                new SitemapNode(new Uri("https://messianicradio.com/#/about"), navPageModifiedDate, SitemapFrequency.Yearly)
            });

            var sitemapService = new SimpleSiteMap.SitemapService();
            var xml = sitemapService.ConvertToXmlUrlset(sitemapItems);
            return Content(xml, "application/xml");
        }

        private async Task<List<SitemapNode>> GetSongsAsSitemapItems()
        {
            // See how many songs we have so we can be more efficient about creating the big list.
            var songCount = await DbSession.Query<Song>().CountAsync();
            var songsList = new List<SitemapNode>(songCount + 10);

            using (var songStream = await DbSession.Advanced.StreamAsync<Song>("songs/"))
            {
                while (await songStream.MoveNextAsync())
                {
                    var url = new Uri("https://messianicradio.com?song=" + songStream.Current.Id);
                    var lastModified = DateTime.Parse((string)songStream.Current.Metadata["@last-modified"]);
                    var sitemapNode = new SitemapNode(url, lastModified, SitemapFrequency.Monthly);
                    songsList.Add(sitemapNode);
                }
            }

            return songsList;
        }
    }
}
