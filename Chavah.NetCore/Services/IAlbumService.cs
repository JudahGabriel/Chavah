using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;

namespace BitShuva.Chavah.Services
{
    public interface IAlbumService
    {
        Task<Album> GetAlbumByAsync(string album, string artist);
        Task<Album> GetMatchingAlbumAsync(Expression<Func<Album, bool>> predicate);
    }
}
