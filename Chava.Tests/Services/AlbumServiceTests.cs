using BitShuva.Models;
using BitShuva.Services;
using Newtonsoft.Json;
using Raven.Client;
using Raven.Client.Embedded;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Xunit;

namespace Chava.Tests.Services
{
    public class AlbumServiceTests
    {
        private EmbeddableDocumentStore _documentStore;
        private AlbumService _albumService;
        private IAsyncDocumentSession _session;

        #region TestInitize
        /// <summary>
        /// TestInitialize for the tests
        /// </summary>
        public AlbumServiceTests()
        {
            // Arrange
            _documentStore = new InMemoryDocumentStore().Store;
            _session = _documentStore.OpenAsyncSession();

            #region Create inMemory 
            List<Song> songs = JsonConvert.DeserializeObject<List<Song>>(File.ReadAllText(@"Data/songs.json"));
            List<Album> albums = JsonConvert.DeserializeObject<List<Album>>(File.ReadAllText(@"Data/albums.json"));
            using (var session = _documentStore.OpenSession())
            {
                songs.ForEach(a =>  session.Store(a));
                albums.ForEach(a => session.Store(a));
                //save all changes at once
                session.SaveChanges();
            }
          
            #endregion

            _albumService = new AlbumService(_session);
        }
        #endregion
        [Fact]
        public async Task GetMatchingSongAsyncTest()
        {  
            //Act
            var result = await _albumService.GetMatchingAlbumAsync(s => s.Name == "Revive");
            //Assert
            Assert.NotNull(result);
            Assert.Equal("Revive", result.Name);
        }
        
    }
}
