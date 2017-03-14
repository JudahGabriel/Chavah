using BitShuva.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BitShuva.Interfaces
{
    public interface ILoggerService
    {
        Task<ChavahLog> Error(string message, 
                              string exception, 
                              object details = null);

        Task<ChavahLog> Warn(string message,
                             object details = null);

        Task<ChavahLog> Info(string message,
                             object details = null);

        Task<ChavahLog> Log(string message,
                                        string exception,
                                        LogLevel logLevel,
                                        object details = null);
        /// <summary>
        /// Activity Object return
        /// </summary>
        /// <param name="take"></param>
        /// <returns></returns>
        Task<IList<Activity>> GetActivity(int take);

    }
}
