using Raven.Abstractions.Data;
//using Raven.Abstractions.Extensions;
using Raven.Client;
using System.Collections.Generic;
using System.Linq;

namespace BitShuva.Chavah.Models.Patches
{
    /// <summary>
    /// Patches songs to have album IDs. Allows us to more quickly look up the album for a song.
    /// </summary>
    public class SongsHaveAlbumIds : PatchBase
    {
        public SongsHaveAlbumIds()
        {
            this.Number = 1;
        }

        protected override void BeforePatch(IDocumentStore db)
        {
            base.BeforePatch(db);

            // Stream in all the Albums and Songs so that we can bulk update the songs.
            var albums = new List<Album>(600);
            var songs = new List<Song>(4100);
            using (var dbSession = db.OpenSession())
            {
                var albumStream = dbSession.Advanced.Stream<Album>("Albums/");
                while (albumStream.MoveNext())
                {
                    albums.Add(albumStream.Current.Document);
                }

                var songStream = dbSession.Advanced.Stream<Song>("Songs/");
                while (songStream.MoveNext())
                {
                    songs.Add(songStream.Current.Document);
                }
            }

            // Now that we have all the songs and albums in memory, update the songs in bulk.
            var bulkInsertOptions = new BulkInsertOptions
            {
                OverwriteExisting = true
            };
            using (var bulkInsert = db.BulkInsert(options: bulkInsertOptions))
            {
                foreach (var album in albums)
                {
                    var albumName = album.Name;
                    var albumArtist = album.Artist;
                    var albumId = album.Id;
                    var songsForAlbum = songs
                        .Where(s => string.IsNullOrEmpty(s.AlbumId))
                        .Where(s => s.Artist == albumArtist && s.Album == albumName);
                    songsForAlbum.ForEach(s =>
                    {
                        s.AlbumId = albumId;
                        bulkInsert.Store(s, s.Id);
                    });
                }
            }
        }
    }
}