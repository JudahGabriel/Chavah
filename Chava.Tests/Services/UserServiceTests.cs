using BitShuva.Models;
using BitShuva.Services;
using Newtonsoft.Json;
using Raven.Client;
using Raven.Client.Embedded;
using RavenDB.AspNet.Identity;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Xunit;

namespace Chava.Tests.Services
{
    public class UserServiceTests
    {
        private EmbeddableDocumentStore _documentStore;
        private UserService _userService;
        private IAsyncDocumentSession _session;

        #region TestInitize
        /// <summary>
        /// TestInitialize for the tests
        /// </summary>
        public UserServiceTests()
        {
            // Arrange
            _documentStore = new InMemoryDocumentStore().Store;
            _session = _documentStore.OpenAsyncSession();

            #region Create inMemory 
            List<ApplicationUser> users = JsonConvert.DeserializeObject<List<ApplicationUser>>(File.ReadAllText(@"Data/users.json"));
            using (var session = _documentStore.OpenSession())
            {
                foreach (var user in users)
                {
                    user.Id = $"ApplicationUsers/{user.Email}";
                    session.Store(user);
                }
                //save all changes at once
                session.SaveChanges();
            }
          
            #endregion

            _userService = new UserService(_session);
        }
        #endregion
        [Fact]
        public async Task RegisteredUsersTest()
        {  
            //Act
            var result = await _userService.RegisteredUsers(1);
            //Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.Count);
        }

        [Fact]
        public async Task GetUserByUserNameTest()
        {
            //Act
            var result = await _userService.GetUser("admin@messianicradio.com");
            var obj = (IdentityUser)result;
            //Assert
            Assert.NotNull(result);
            Assert.Equal("admin@messianicradio.com", result.Email);
        }
    }
}
