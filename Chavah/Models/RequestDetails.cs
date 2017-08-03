using BitShuva.Common;
using Newtonsoft.Json;
using Optional;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Models
{
    public class RequestDetails
    {
        public RequestDetails()
        {
        }

        public static async Task<RequestDetails> FromHttpRequest(HttpRequestMessage request, Option<SessionToken> sessionToken)
        {
            var result = new RequestDetails
            {
                Method = request.Method?.Method,
                Uri = request.RequestUri?.ToString(),
                UserId = sessionToken.Map(t => t.UserId).ValueOrDefault(),
                Headers = request.Headers != null ? JsonConvert.SerializeObject(request.Headers.ToDictionary(a => a.Key, a => string.Join(";", a.Value))) : string.Empty
            };

            result.Content = await TryLoadContent(request);
            return result;
        }

        private static async Task<string> TryLoadContent(HttpRequestMessage request)
        {
            if (request.Content == null)
            {
                return string.Empty;
            }

            try
            {
                using (var contentStream = await request.Content.ReadAsStreamAsync())
                {
                    contentStream.Position = 0;
                    using (var streamReader = new System.IO.StreamReader(contentStream))
                    {
                        return await streamReader.ReadToEndAsync();
                    }
                }
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        public string Method { get; set; }
        public string Uri { get; set; }
        public string UserId { get; set; }
        public string Content { get; set; }
        public string Headers { get; set; }
    }
}