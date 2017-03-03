using System.Threading.Tasks;
using BitShuva.Models;
using System.Collections.Generic;

namespace BitShuva.Interfaces
{
    public interface IUserService
    {
        Task<ApplicationUser> GetUser(string idenityName);

        Task<IList<ApplicationUser>> RegisteredUsers(int take);
    }
}