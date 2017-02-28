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
    public class SongServiceTests
    {
        private EmbeddableDocumentStore _documentStore;
        private SongService _songService;
        private IAsyncDocumentSession _session;

        #region TestInitize
        /// <summary>
        /// TestInitialize for the tests
        /// </summary>
        public SongServiceTests()
        {
            // Arrange
            _documentStore = new InMemoryDocumentStore().Store;
            _session = _documentStore.OpenAsyncSession();

            #region Create inMemory Songs
            string songsJson = File.ReadAllText(@"Data/songs.json");
            List<Song> songs = JsonConvert.DeserializeObject<List<Song>>(songsJson);
            using(var session = _documentStore.OpenSession())
            {
                foreach (var song in songs)
                {
                    session.Store(song);
                    session.SaveChanges();
                }
            }
           
            #endregion

            _songService = new SongService(_session);
        }
        #endregion

        [Fact]
        public async Task GetSongByIdQueryAsyncTest()
        {
            //Act
            var result = await _songService.GetSongByIdQueryAsync("songs/1");

            //Assert
            Assert.NotNull(result);
            Assert.Equal("Revive", result.Album);
        }

        [Fact]
        public async Task GetMatchingSongAsyncTest()
        {  
            //Act
            var result = await _songService.GetMatchingSongAsync(s => s.Album == "Revive");
            //Assert
            Assert.NotNull(result);
            Assert.Equal("Revive", result.Album);
        }
        [Fact]
        public async Task GetSongByAlbumAsyncTest()
        {
            //Act
            var result = await _songService.GetSongByAlbumAsync("Revive");

            //Assert
            Assert.NotNull(result);
            Assert.Equal("Revive", result.Album);
        }
        [Fact]
        public async Task GetSongByArtistAsyncTest()
        {
            //Act
            var result = await _songService.GetSongByArtistAsync("Giselle");

            //Assert
            Assert.NotNull(result);
            Assert.Equal("Giselle", result.Artist);
        }
    }
}
