using System.Collections.Generic;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;

namespace BitShuva.Chavah.Services
{
    public interface IUserService
    {
        Task<AppUser> GetUser(string idenityName);
        Task<List<AppUser>> RegisteredUsers(int take);
    }
}
