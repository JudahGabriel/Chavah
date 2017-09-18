using System.Threading.Tasks;
using BitShuva.Chavah.Models;
using System.Collections.Generic;

namespace BitShuva.Chavah.Services
{
    public interface IUserService
    {
        Task<AppUser> GetUser(string idenityName);
        Task<IList<AppUser>> RegisteredUsers(int take);
    }
}