﻿using System;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// An album for which album art has been uploaded.
    /// </summary>
    public class Album
    {
        public string Artist { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? HebrewName { get; set; }
        public Uri AlbumArtUri { get; set; } = UriExtensions.Localhost;
        public string? Id { get; set; }
        public string BackgroundColor { get; set; } = string.Empty;
        public string ForegroundColor { get; set; } = string.Empty;
        public string MutedColor { get; set; } = string.Empty;
        public string TextShadowColor { get; set; } = string.Empty;
        public bool IsVariousArtists { get; set; }
        public int SongCount { get; set; }
    }
}
