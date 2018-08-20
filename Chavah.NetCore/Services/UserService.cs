using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BitShuva.Chavah.Models;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Services
{
    public class UserService : IUserService
    {
        private readonly IAsyncDocumentSession _session;

        public UserService(IAsyncDocumentSession session)
        {
            _session = session;
        }

        public Task<AppUser> GetUser(string idenityName)
        {
            return _session.LoadAsync<AppUser>($"AppUsers/{idenityName}");
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
