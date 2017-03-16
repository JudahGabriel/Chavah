using BitShuva.Interfaces;
using BitShuva.Models;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BitShuva.Services
{
    public class UserService : IUserService
    {
        private IAsyncDocumentSession _session;

        public UserService(IAsyncDocumentSession session)
        {
            _session = session;
        }

        public async Task<ApplicationUser> GetUser(string idenityName)
        {
            using (_session.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(3)))
            {
                return await _session.LoadAsync<ApplicationUser>($"ApplicationUsers/{idenityName}");
            }
        }

        public async Task<IList<ApplicationUser>> RegisteredUsers(int take)
        {
            return await _session
                .Query<ApplicationUser>()
                .Where(u => u.Email != null)
                .OrderByDescending(a => a.RegistrationDate)
                .Take(take)
                .ToListAsync();
        }
    }
}
