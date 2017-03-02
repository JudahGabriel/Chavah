﻿using BitShuva.Models;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BitShuva.Services
{
    public class AlbumService
    {
        private IAsyncDocumentSession _session;

        public AlbumService(IAsyncDocumentSession session)
        {
            _session = session;
        }

        public async Task<Album> GetAlbumByAsync(string album, string artist)
        {
            return await GetMatchingAlbumAsync(x => x.Name == album && x.Artist == artist);
        }

        public async Task<Album> GetMatchingAlbumAsync(System.Linq.Expressions.Expression<Func<Album, bool>> predicate)
        {
            return await _session.Query<Album>()
                .Where(predicate)
                .FirstOrDefaultAsync();
        }
    }
}
