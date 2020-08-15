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

        public Uri GetSongShareLink(string url)
        {
            return new Uri($"{url}/?song={Id}");
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
