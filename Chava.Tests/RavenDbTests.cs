using System;
using BitShuva.Models;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;
using Xunit;
using Raven.Client;
using Raven.Client.Embedded;

namespace Chava.Tests
{
    public class RavenDbTests
    {
        private EmbeddableDocumentStore _store;

        public RavenDbTests()
        {
            _store = new InMemoryDocumentStore().Store;
        }

        [Fact]
        public void TestMethod1()
        {
            try
            {
                String json = File.ReadAllText(@"batch-songs.json");
                IEnumerable<Song> songs = JsonConvert.DeserializeObject<IEnumerable<Song>>(json);

                using (IDocumentSession session = _store.OpenSession())
                {

                    foreach (var song in songs)
                    {
                        var albumUri = "http://localhost:7171/chavah/album-art/" + song.AlbumArtUri.OriginalString;
                        song.AlbumArtUri = new Uri(albumUri);

                        var songUri = "http://localhost:7171/chavah/music/" + song.Uri.OriginalString;
                        song.Uri = new Uri(songUri);

                        session.Store(song);
                        session.SaveChanges();
                    }
                    //Song song = new Song();

                    //song.Artist = "Artist";
                    //song.Album = "Album";
                    //song.CommunityRank = 5;
                    //song.Name = "Name";
                    //song.Number = 1;
                    //song.PurchaseUri = "PurchaseUri";
                    //song.AlbumArtUri = new Uri("http://AlbumArtUri");
                    //song.Genres = new List<string>();
                    //song.Tags = new List<string>();
                    //song.Lyrics = "Lyrics";

                }
            }
            catch (Exception ex)
            {

                throw;
            }


        }
    }
}
