using System;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    public class TempFile
    {
        /// <summary>
        /// The URL where the media file has been uploaded.
        /// </summary>
        public Uri Url { get; set; } = UriExtensions.Localhost;

        /// <summary>
        /// The name of the media file.
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// The ID of the temp file. CDN providers use this ID to find the temp file.
        /// </summary>
        public string Id { get; set; } = string.Empty;
    }
}
