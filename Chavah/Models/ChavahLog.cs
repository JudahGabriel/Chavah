using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Models
{
    public class ChavahLog
    {
        public string Id { get; set; }
        public string Message { get; set; }
        public DateTime DateUtc { get; set; }

        public static async Task WriteToDatabase(string errorMessage)
        {
            using (var session = RavenDataStore.Store.OpenAsyncSession())
            {
                try
                {
                    await session.StoreAsync(new ChavahLog { DateUtc = DateTime.UtcNow, Message = errorMessage });
                    await session.SaveChangesAsync();
                }
                catch
                {
                    // Unable to log to DB. Swallow the error.
                }
            }
        }
    }
}