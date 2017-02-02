using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Raven.Client.Document;
using BitShuva.Models;
using Raven.Client;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace Chava.Tests
{
    [TestClass]
    public class RavenDbTests
    {
        [TestInitialize]
        public void TestInitialize()
        {

        }
        [TestMethod]
        public void TestMethod1()
        {
            try
            {
                var store = new DocumentStore { ConnectionStringName = "RavenDB" };
                store.Initialize();
                String json = File.ReadAllText(@"batch-songs.json");


                IEnumerable<Song> songs = JsonConvert.DeserializeObject<IEnumerable<Song>>(json);

                using (IDocumentSession session = store.OpenSession())
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
