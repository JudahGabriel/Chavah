using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using BitShuva.Models;

namespace BitShuva.Interfaces
{
    public interface IAlbumService
    {
        Task<Album> GetAlbumByAsync(string album, string artist);
        Task<Album> GetMatchingAlbumAsync(Expression<Func<Album, bool>> predicate);
    }
}