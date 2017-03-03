using BitShuva.Controllers;
using BitShuva.Services;
using Rhino.Mocks;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;
using Raven.Client.Embedded;
using Raven.Client;
using System.Web.Routing;
using System.Web.Mvc;
using System.Security.Principal;
using System.Threading;
using System.Web;
using BitShuva.Models;

namespace Chava.Tests.Controllers
{
    public class HomeControllerTests : BaseControllerTest
    {
        private HomeController _controller;
        private EmbeddableDocumentStore _documentStore;
        private IAsyncDocumentSession _session;

        #region TestInitize
        public HomeControllerTests()
        {
            _documentStore = new InMemoryDocumentStore().Store;
            _session = _documentStore.OpenAsyncSession();

            #region Controller
            var log = new LoggerService(_session);
            var song = new SongService(_session);
            var album = new AlbumService(_session);
            var user = new UserService(_session);

            _controller = new HomeController(log, song, album, user);
            #endregion

            #region other IPrinciple and IIdentity
            //IIdentity mockIdentity = MockRepository.GenerateMock<IIdentity>();
            //mockIdentity.Stub(p => p.Name).Return("admin@messianicradio.com").Repeat.Any();

            //IPrincipal mockPrinciple = MockRepository.GenerateMock<IPrincipal>();
            //mockPrinciple.Stub(p => p.Identity).Return(mockIdentity).Repeat.Any();
            #endregion
        }
        #endregion

        [Fact]
        public async Task IndexTest()
        {
            //Arrange
            #region Query Object

            var queryString  = new NameValueCollection{{"song", "songs/1" }};
            var mockRequest = MockRepository.GenerateMock<HttpRequestBase>();
            mockRequest.Stub(r => r.QueryString).Return(queryString);
            var mockHttpContext = MockRepository.GenerateMock<HttpContextBase>();
            mockHttpContext.Stub(h => h.User.Identity.Name).Return("admin@messianicradio.com");

            mockHttpContext.Stub(c => c.Request).Return(mockRequest);

            var mockControllerContext = MockRepository.GenerateMock<ControllerContext>();
            mockControllerContext.Stub(x => x.HttpContext).Return(mockHttpContext);

            #endregion
            
            _controller.ControllerContext = mockControllerContext;

            var result = await _controller.Index();
            var v = result as ViewResult;

            Assert.NotNull(result);
            Assert.NotNull(v.Model);
         
        }

        [Fact]
        public async Task IndexNoUserFoundTest()
        {
            //Arrange
            var userName = "admin@messianicradio.com";
            var result = await _controller.Index(user: userName) as JsonResult;
            var userReturned = result.Data as ApplicationUser;
            Assert.Equal(string.Empty,userReturned.Email);
        }
    }
}
