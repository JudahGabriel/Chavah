using System;
using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System.Linq.Expressions;

namespace BitShuva.Chavah.Services
{
    public class AlbumService : IAlbumService
    {
        private readonly IAsyncDocumentSession _session;

        public AlbumService(IAsyncDocumentSession session)
        {
            _session = session;
        }

        public async Task<Album> GetAlbumByAsync(string album, string artist)
        {
            return await GetMatchingAlbumAsync(x => x.Name == album && x.Artist == artist);
        }

        public async Task<Album> GetMatchingAlbumAsync(Expression<Func<Album, bool>> predicate)
        {
            return await _session.Query<Album>()
                .Where(predicate)
                .FirstOrDefaultAsync();
        }
    }
}
