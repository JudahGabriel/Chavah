using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;

namespace BitShuva.Chavah.Services
{
    public interface ISongService
    {
        Task<Song> GetMatchingSongAsync(Expression<Func<Song, bool>> predicate);
        Task<Song> GetSongByAlbumAsync(string albumQuery);
        Task<Song> GetSongByArtistAsync(string artistQuery);
        Task<Song> GetSongByIdQueryAsync(string songQuery);
    }
}
