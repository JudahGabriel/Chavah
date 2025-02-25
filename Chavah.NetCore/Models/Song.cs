using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Text.RegularExpressions;
using System.IO;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    public class Song
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string HebrewName { get; set; } = string.Empty;
        public int Number { get; set; }
        public string Album { get; set; } = string.Empty;
        public string? AlbumHebrewName { get; set; }
        public string Artist { get; set; } = string.Empty;
        public Uri AlbumArtUri { get; set; } = UriExtensions.Localhost;
        public Uri Uri { get; set; } = UriExtensions.Localhost;
        public Uri? PurchaseUri { get; set; }
        public LikeStatus SongLike { get; set; }
        public int CommunityRank { get; set; }
        public CommunityRankStanding CommunityRankStanding { get; set; }
        public DateTime UploadDate { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public List<string> Genres { get; set; } = new List<string>();
        public string Lyrics { get; set; } = string.Empty;
        public int TotalPlays { get; set; }
        public string? AlbumId { get; set; }
        public string? ArtistId { get; set; }
        public int CommentCount { get; set; }
        public AlbumColors AlbumColors { get; set; } = new AlbumColors();
        public SongPickReasons? ReasonsPlayed { get; set; }
        public List<string> ContributingArtists { get; set; } = new List<string>();
        // Add a property here? It should probably be added to .ToDto()

        /// <summary>
        /// Creates a new song object that's ready to be sent as a data transfer object over to the client.
        /// </summary>
        /// <param name="likeStatus">The like status for the song.</param>
        /// <param name="playedReason"></param>
        /// <returns></returns>
        public Song ToDto(LikeStatus likeStatus, SongPick playedReason)
        {
            return ToDto(likeStatus, SongPickReasons.FromSoleReason(playedReason));
        }

        /// <summary>
        /// Creates a new song object that's ready to be sent as a data transfer object over to the client.
        /// </summary>
        /// <param name="likeStatus">The like status for the song.</param>
        /// <param name="pickReasons"></param>
        /// <returns></returns>
        public virtual Song ToDto(LikeStatus likeStatus, SongPickReasons pickReasons)
        {
            return new Song
            {
                Album = Album,
                AlbumHebrewName = AlbumHebrewName,
                Artist = Artist,
                CommunityRank = CommunityRank,
                CommunityRankStanding = CommunityRankStanding,
                Id = Id,
                SongLike = likeStatus,
                Name = Name,
                HebrewName = HebrewName,
                Number = Number,
                Uri = Uri,
                AlbumArtUri = AlbumArtUri,
                PurchaseUri = PurchaseUri,
                Genres = Genres,
                Tags = Tags,
                Lyrics = Lyrics,
                TotalPlays = TotalPlays,
                ReasonsPlayed = pickReasons,
                AlbumId = AlbumId,
                ArtistId = ArtistId,
                CommentCount = CommentCount,
                AlbumColors = AlbumColors,
                ContributingArtists = ContributingArtists
            };
        }

        /// <summary>
        /// Creates a new song object that's ready to be sent as a data transfer object over to the client.
        /// </summary>
        /// <returns></returns>
        public Song ToDto()
        {
            return ToDto(LikeStatus.None, SongPick.RandomSong);
        }

        /// <summary>
        /// Gets the link to the song used in social media shares.
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        public Uri GetShareLink(string url)
        {
            return new Uri($"{url}/?song={Id}");
        }

        /// <summary>
        /// Gets the embed URL for the song used in social media shares.
        /// </summary>
        /// <param name="rootUrl">The root website domain, e.g. messianicradio.com</param>
        /// <returns></returns>
        public Uri GetShareEmbedUrl(string rootUrl)
        {
            return new Uri($"{rootUrl}?song={Id}&embed=true&twitterembed=true");
        }

        /// <summary>
        /// Gets title of the song for use in social media shares, e.g. "Adonai Li אדוני לי".
        /// If the song doesn't have a Hebrew name, only the English name is returned.
        /// </summary>
        /// <returns></returns>
        public string GetShareTitle()
        {
            var featuringString = ContributingArtists.Any()
                ? $" ft. {string.Join(", ", ContributingArtists)}"
                : string.Empty;
            if (!string.IsNullOrEmpty(HebrewName) && !string.IsNullOrEmpty(Name))
            {
                return $"{Name} {HebrewName} by {Artist}{featuringString}";
            }

            return Name;
        }

        /// <summary>
        /// Gets the longer description used in social media shares.
        /// </summary>
        /// <returns></returns>
        public string GetShareDescription()
        {
            var communityRankPrefix = CommunityRank > 0 ? "+" : string.Empty;
            return $"{GetShareTitle()} appears as the {Number.ToNumberWord()} on the {Album} album. Chavah listeners rank it {communityRankPrefix}{CommunityRank}.";
        }

        public string GetCommunityRankText()
        {
            if (CommunityRank > 0)
            {
                return $"+{CommunityRank}";
            }

            return CommunityRank.ToString();
        }

        /// <summary>
        /// Updates the denormalized album data from the specified album.
        /// </summary>
        /// <param name="album"></param>
        public void UpdateAlbumInfo(Album album)
        {
            Album = album.Name;
            AlbumHebrewName = album.HebrewName;
            AlbumArtUri = album.AlbumArtUri;
            AlbumColors.Background = album.BackgroundColor;
            AlbumColors.Foreground = album.ForegroundColor;
            AlbumColors.Muted = album.MutedColor;
            AlbumColors.TextShadow = album.TextShadowColor;
        }
    }
}
