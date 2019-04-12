using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models.Rss;
using Chavah.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SyndicationFeed;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using Xunit;

namespace xUnitTests
{
    public class HomeControllerTests
    {
        private const string RadioUrl = "https://messianicradio.com";

        [Fact]
        public void RssActionResult_Success()
        {
            var responseMock = new Mock<HttpResponse>();
            responseMock.Setup(x => x.Body).Returns(new MemoryStream());

            var httpContextMock = new Mock<HttpContext>();
            httpContextMock.SetupGet(a => a.Response).Returns(responseMock.Object);

            var mockActionContext = new ActionContext()
            {
                HttpContext = httpContextMock.Object
            };

            // Create item
            var item = new SyndicationItem()
            {
                Title = "Chavah Messianic Radio",
                Description = "The latest activity over at Chavah Messianic Radio",
                Id = "https://messianicradio.com/",
                Published = DateTimeOffset.UtcNow
            };

            var items = new List<SyndicationItem>
            {
                item
            };

            var feed = new SyndicationFeed("Chavah Messianic Radio",
                                           "The most recent registered users at Chavah Messianic Radio",
                                           new Uri(RadioUrl),
                                           "",
                                           items, "en-US");

            var sut = new RssActionResult(feed);

            sut.ExecuteResult(mockActionContext);

            responseMock.Verify(x => x.Body);
        }
    }
}
