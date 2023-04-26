﻿using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;

using Newtonsoft.Json;

namespace BitShuva.Chavah.Models
{
    public class RequestDetails
    {
        public static async Task<RequestDetails> FromHttpRequest(HttpRequestMessage request, SessionToken? sessionToken)
        {
            var result = new RequestDetails
            {
                Method = request.Method?.Method,
                Uri = request.RequestUri?.ToString(),
                UserId = sessionToken?.UserId,
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

        public string? Method { get; set; }
        public string? Uri { get; set; }
        public string? UserId { get; set; }
        public string? Content { get; set; }
        public string? Headers { get; set; }
    }
}
