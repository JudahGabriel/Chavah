using BitShuva.Controllers;
using Raven.Client.Embedded;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Raven.Client;
using System.Web.Http.Results;
using BitShuva.Models.Indexes;

namespace Chava.Tests.Api
{
    public class TestControllerTest
    {
        private TestController _controller;
        private EmbeddableDocumentStore _documentStore;
        private IAsyncDocumentSession _session;

        #region TestInitize
        /// <summary>
        /// TestInitialize for the tests
        /// </summary>
        public TestControllerTest()
        {
            // Arrange
            _documentStore = new InMemoryDocumentStore().Store;
            _session = _documentStore.OpenAsyncSession();
            _controller = new TestController(_session);
        }
        #endregion

        [Fact]
        public async Task GetShouldReturn0Count()
        {
            //act 
            var actionResult = await _controller.Get();
            var response = actionResult as OkNegotiatedContentResult<IList<Songs_RankStandings.Result>>;

            //assert
            Assert.NotNull(response);
            Assert.Equal(0, response.Content.Count());
        }
    }
}
