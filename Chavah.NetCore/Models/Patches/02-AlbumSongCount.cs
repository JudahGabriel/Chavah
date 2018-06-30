using Raven.Client.Documents;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models.Patches
{
    public class AlbumSongCount : PatchBase
    {
        public AlbumSongCount()
        {
            this.Number = 2;
            this.Collection = "Albums";
            this.Script = "this.SongCount = 0;";
        }

        protected override void AfterPatchComplete(IDocumentStore db)
        {
            base.AfterPatchComplete(db);

            // Figure out the song count for each album.
            var albumIdSongCounts = new Dictionary<string, (Album album, int songCount)>(600);
            using (var dbSession = db.OpenSession())
            {
                var albumStream = dbSession.Advanced.Stream<Album>("albums/");
                while (albumStream.MoveNext())
                {
                    albumIdSongCounts.Add(albumStream.Current.Document.Id, (albumStream.Current.Document, 0));
                }
                
                var songStream = dbSession.Advanced.Stream<Song>("songs/");
                while (songStream.MoveNext())
                {
                    var albumId = songStream.Current.Document.AlbumId;
                    if (!string.IsNullOrWhiteSpace(albumId))
                    {
                        var found = albumIdSongCounts.TryGetValue(songStream.Current.Document.AlbumId, out var val);
                        if (found)
                        {
                            albumIdSongCounts[songStream.Current.Document.AlbumId] = (val.album, val.songCount + 1);
                        }
                    }
                }
            }

            // Now that we have all the songs and albums in memory, update the albums in bulk.
            using (var bulkInsert = db.BulkInsert())
            {
                foreach (var albumSongCount in albumIdSongCounts.Values)
                {
                    albumSongCount.album.SongCount = albumSongCount.songCount;
                    if (albumSongCount.songCount > 0)
                    {
                        bulkInsert.Store(albumSongCount.album, albumSongCount.album.Id);
                    }
                }
            }
        }
    }
}