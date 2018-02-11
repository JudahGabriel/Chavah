using BitShuva.Chavah.Models;
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
    public class UserService : IUserService
    {
        private IAsyncDocumentSession _session;

        public UserService(IAsyncDocumentSession session)
        {
            _session = session;
        }

        public async Task<AppUser> GetUser(string userId)
        {
            using (_session.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(3)))
            {
                return await _session.LoadAsync<AppUser>($"AppUsers/{userId}");
            }
        }

        public Task<List<AppUser>> RegisteredUsers(int take)
        {
            return _session
                .Query<AppUser>()
                .Where(u => u.Email != null)
                .OrderByDescending(a => a.RegistrationDate)
                .Take(take)
                .ToListAsync();
        }
    }
}
