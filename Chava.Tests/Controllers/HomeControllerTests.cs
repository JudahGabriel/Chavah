using BitShuva.Controllers;
using BitShuva.Services;
using Rhino.Mocks;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Raven.Client.Embedded;
using Raven.Client;
using System.Web.Mvc;
using System.Web;
using BitShuva.Models;
using Newtonsoft.Json;
using System.IO;
using Chavah.Common;
using BitShuva.ViewModels;

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

            #region Load test data
            List<ApplicationUser> users = JsonConvert.DeserializeObject<List<ApplicationUser>>(File.ReadAllText(@"Data/users.json"));
            List<Song> songs = JsonConvert.DeserializeObject<List<Song>>(File.ReadAllText(@"Data/songs.json"));
            List<Album> albums = JsonConvert.DeserializeObject<List<Album>>(File.ReadAllText(@"Data/albums.json"));
            using (var session = _documentStore.OpenSession())
            {
                foreach (var user in users)
                {
                    user.Id = $"ApplicationUsers/{user.Email}";
                    session.Store(user);
                }

                songs.ForEach(a => session.Store(a));
                albums.ForEach(a => session.Store(a));
                //save all changes at once
                session.SaveChanges();
            }
            #endregion

            #region IoC Controller
            var logService = new LoggerService(_session);
            var songService = new SongService(_session);
            var albumService = new AlbumService(_session);
            var userService = new UserService(_session);

            _controller = new HomeController(logService, songService, albumService, userService);
            #endregion
        }
        #endregion

        #region Index Action Tests
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
        public async Task IndexNoUserFoundReturnEmptyJsonTest()
        {
            //Arrange
            var userName = "admin1@messianicradio.com";
            //Act
            var result = await _controller.Index(user: userName) as JsonResult;
            var userReturned = result.Data as ApplicationUser;
            //Assert
            Assert.NotNull(userReturned);
            Assert.Null(userReturned.Email);
        }

        [Fact]
        public async Task IndexNoUserFoundReturnUserJsonTest()
        {
            //Arrange
            var email = "admin@messianicradio.com";
            //Act
            var result = await _controller.Index(user: email) as JsonResult;
            var userReturned = result.Data as ApplicationUser;
            //Assert
            Assert.NotNull(result);
            Assert.NotNull(userReturned);
            Assert.Equal(email, userReturned.Email);
        }

        [Fact]
        public async Task IndexFoundSonSuccefulNoUserTest()
        {
            //Assign
            #region Context with Null Idenity
            var mockRequest = MockRepository.GenerateMock<HttpRequestBase>();
            var mockHttpContext = MockRepository.GenerateMock<HttpContextBase>();
            mockHttpContext.Stub(h => h.User.Identity.Name).Return(null);

            mockHttpContext.Stub(c => c.Request).Return(mockRequest);

            var mockControllerContext = MockRepository.GenerateMock<ControllerContext>();
            mockControllerContext.Stub(x => x.HttpContext).Return(mockHttpContext);
            _controller.ControllerContext = mockControllerContext;
            #endregion

            //Act
            var result = await _controller.Index(song: "1") as ViewResult;
            var model = result.Model as HomeViewModel;
            //Assert
            Assert.NotNull(result);
            Assert.NotNull(model.Song);
            Assert.Equal("Revive", model.Song.Album);
            //this value comes from SongService
            Assert.Equal("songs/1", model.Song.Id);
            //this value comes from AlbumService
            Assert.Equal(@"http://bitshuvafiles01.com/chavah/album-art/greg silverman - revive.jpg", model.DescriptiveImageUrl);
        }

        [Fact]
        public async Task IndexFoundSonSuccefulAdminUserTest()
        {
            //Assign
            var email = "admin@messianicradio.com";
            #region Context with Null Idenity
            var mockRequest = MockRepository.GenerateMock<HttpRequestBase>();
            var mockHttpContext = MockRepository.GenerateMock<HttpContextBase>();
            mockHttpContext.Stub(h => h.User.Identity.Name).Return(email);

            mockHttpContext.Stub(c => c.Request).Return(mockRequest);

            var mockControllerContext = MockRepository.GenerateMock<ControllerContext>();
            mockControllerContext.Stub(x => x.HttpContext).Return(mockHttpContext);
            _controller.ControllerContext = mockControllerContext;
            #endregion

            //Act
            var result = await _controller.Index(song: "1") as ViewResult;
            var model = result.Model as HomeViewModel;
            //Assert
            Assert.NotNull(result);
            Assert.NotNull(model.Song);
            Assert.Equal("Revive", model.Song.Album);
            //this value comes from SongService
            Assert.Equal("songs/1", model.Song.Id);
            //this value comes from AlbumService
            Assert.Equal(@"http://bitshuvafiles01.com/chavah/album-art/greg silverman - revive.jpg", model.DescriptiveImageUrl);

            Assert.Equal(email,model.UserEmail);
        }

        #endregion

        [Fact]
        public async Task RegisteredUsersSuccefulTest()
        {
            //Act
            var result = await _controller.RegisteredUsers() as RssActionResult;
            //Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Feed);
            Assert.Equal(3,result.Feed.Items.Count());

        }
    }
}
