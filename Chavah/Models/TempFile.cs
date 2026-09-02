using System;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    public class TempFile
    {
        /// <summary>
        /// The ID of the temp file in the database.
        /// </summary>
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// The URL where the media file has been uploaded.
        /// </summary>
        public Uri Url { get; set; } = UriExtensions.Localhost;

        /// <summary>
        /// The name of the media file.
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// The CDN's ID of the temp file. CDN providers use this ID to find the temp file.
        /// </summary>
        public string CdnId { get; set; } = string.Empty;

        /// <summary>
        /// The date and time the temp file was created. This is used to delete temp files that are too old and were not used to create a media item.
        /// </summary>
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
