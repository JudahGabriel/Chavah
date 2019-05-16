using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using BitShuva.Chavah.Settings;
using Microsoft.Extensions.Options;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// An HTTP client configured for POSTing files to BunnyCDN.
    /// </summary>
    public class BunnyCdnHttpClient : HttpClient
    {
        private const string storageHost = "https://storage.bunnycdn.com";

        public BunnyCdnHttpClient(IOptions<CdnSettings> settings)
        {
            BaseAddress = new Uri(storageHost);
            DefaultRequestHeaders.Add("AccessKey", settings.Value.ApiKey);
        }
    }
}
