using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Raven.Client.Documents;

namespace BitShuva.Chavah.Models.Patches
{
    /// <summary>
    /// Creates <see cref="Artist"/>s in the database and assigns the <see cref="Artist.Id"/> to each <see cref="Song.ArtistId"/>.
    /// </summary>
    public class SongsHaveArtistIds : PatchBase
    {
        public SongsHaveArtistIds()
        {
            this.Number = 8;
        }

        protected override void BeforePatch(IDocumentStore db)
        {
            // Load all the songs and group them by artist.
            var songsByArtist = this.Stream<Song>(db, s => true).GroupBy(s => s.Artist);

            // Load all existing Artists in the database.
            var existingDbArtists = this.Stream<Artist>(db, a => true);

            // Update each of the songs with its corresponding artist.
            foreach (var artistGroup in songsByArtist)
            {
                using (var dbSession = db.OpenSession())
                {
                    var dbArtist = existingDbArtists.FirstOrDefault(a => string.Equals(a.Name, artistGroup.Key, StringComparison.OrdinalIgnoreCase));
                    if (dbArtist == null)
                    {
                        // No artist in the database for this guy? Create one.
                        dbArtist = new Artist
                        {
                            Bio = "",
                            Name = artistGroup.Key
                        };
                        dbSession.Store(dbArtist);
                    }

                    // Update the ArtistId of the songs.
                    var songIdsBelongingToArtist = artistGroup.Select(a => a.Id);
                    var songs = dbSession.Load<Song>(songIdsBelongingToArtist);
                    songs
                        .Where(s => s.Value != null)
                        .ForEach(s => s.Value.ArtistId = dbArtist.Id);

                    dbSession.SaveChanges();
                }
            }
        }
    }
}
