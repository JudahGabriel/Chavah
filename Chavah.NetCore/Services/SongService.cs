using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using Optional;
using Raven.Client;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Services
{
    public class SongService : ISongService
    {
        private IAsyncDocumentSession _session;

        public SongService(IAsyncDocumentSession session)
        {
            _session = session;
        }

        public async Task<Song> GetSongByAlbumAsync(string albumQuery)
        {
            return await GetMatchingSongAsync(s => s.Album == albumQuery);
        }

        public async Task<Song> GetSongByArtistAsync(string artistQuery)
        {
            return await GetMatchingSongAsync(s => s.Artist == artistQuery);
        }

        public async Task<Song> GetSongByIdQueryAsync(string songQuery)
        {
            var properlyFormattedSongId = songQuery.StartsWith("songs/", StringComparison.InvariantCultureIgnoreCase) ?
                songQuery :
                "songs/" + songQuery;

            var song = await _session
                .Include<Song>(s => s.AlbumId)
                .LoadAsync<Song>(properlyFormattedSongId);
            if (song != null && !string.IsNullOrEmpty(song.AlbumId))
            {
                var album = await _session.LoadAsync<Album>(song.AlbumId);
                if (album != null)
                {
                    return SongWithAlbumColors.FromSong(song, Option.Some(album));
                }
            }

            return song;
        }

        public async Task<Song> GetMatchingSongAsync(System.Linq.Expressions.Expression<Func<Song, bool>> predicate)
        {
            return await _session
               .Query<Song, Songs_GeneralQuery>()
               .Customize(x => x.RandomOrdering())
               .Where(predicate)
               .OrderBy(s => s.Id)
               .FirstOrDefaultAsync();
        }
    }
}
