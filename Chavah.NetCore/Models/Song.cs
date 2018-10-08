﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Diagnostics.Contracts;
using Microsoft.Extensions.Options;

namespace BitShuva.Chavah.Models
{
    public class Song
    {
        public Song()
        {
            this.Tags = new List<string>();
            this.Genres = new List<string>();
        }

        public string Name { get; set; }
        public string HebrewName { get; set; }
        public int Number { get; set; }
        public string Album { get; set; }
        public string Artist { get; set; }
        public Uri AlbumArtUri { get; set; }
        public string PurchaseUri { get; set; }
        public Uri Uri { get; set; }
        public LikeStatus SongLike { get; set; }
        public int CommunityRank { get; set; }
        public CommunityRankStanding CommunityRankStanding { get; set; }
        public string Id { get; set; }
        public DateTime UploadDate { get; set; }
        public List<string> Tags { get; set; }
        public List<string> Genres { get; set; }
        public string Lyrics { get; set; }
        public int TotalPlays { get; set; }
        public string AlbumId { get; set; }
        public string ArtistId { get; set; }
        public int CommentCount { get; set; }
        // Add a property here? It should probably be added to .ToDto()
        
        public SongPickReasons ReasonsPlayed { get; set; }

        public static Song FromFileName(string fileName)
        {
            Contract.Requires(fileName != null);
            fileName = System.Uri.UnescapeDataString(fileName);

            var song = new Song();
            var fileNameWithouExtension = System.IO.Path.GetFileNameWithoutExtension(fileName);
            var indexOfLastDash = fileNameWithouExtension.LastIndexOf(" - ");
            if (indexOfLastDash != -1)
            {
                song.Name = fileNameWithouExtension
                    .Substring(indexOfLastDash)
                    .Replace('_', ':')
                    .Trim('-', ' ');
            }

            var indexOfFirstDash = fileNameWithouExtension.IndexOf(" - ");
            if (indexOfFirstDash != -1)
            {
                song.Artist = fileNameWithouExtension
                    .Substring(0, indexOfFirstDash)
                    .Trim('-', ' ');
            }
            var dashCount = fileNameWithouExtension.Count(c => c == '-');
            if (dashCount >= 2)
            {
                var indexOfSecondDash = fileNameWithouExtension.IndexOf(" - ", indexOfFirstDash + 2);
                if (indexOfSecondDash != -1)
                {
                    song.Album = fileNameWithouExtension
                        .Substring(indexOfFirstDash, indexOfSecondDash - indexOfFirstDash)
                        .Trim('-', ' ');
                }
            }

            var songNumberMatch = Regex.Match(fileNameWithouExtension, " - (\\d{2}) - ");
            if (songNumberMatch.Success && songNumberMatch.Groups.Count == 2 && songNumberMatch.Groups[1].Success)
            {
                song.Number = int.Parse(songNumberMatch.Groups[1].Value);
            }

            if (string.IsNullOrWhiteSpace(song.Name))
            {
                song.Name = "Unknown";
            }
            if (string.IsNullOrWhiteSpace(song.Artist))
            {
                song.Artist = "Unknown Artist";
            }
            if (string.IsNullOrWhiteSpace(song.Album))
            {
                song.Album = "Unknown Album";
            }

            return song;
        }

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
        public Song ToDto(LikeStatus likeStatus, SongPickReasons pickReasons)
        {
            return new Song
            {
                Album = this.Album,
                Artist = this.Artist,
                CommunityRank = this.CommunityRank,
                CommunityRankStanding = this.CommunityRankStanding,
                Id = this.Id,
                SongLike = likeStatus,
                Name = this.Name,
                HebrewName = this.HebrewName,
                Number = this.Number,
                Uri = this.Uri,
                AlbumArtUri = this.AlbumArtUri,
                PurchaseUri = this.PurchaseUri,
                Genres = this.Genres,
                Tags = this.Tags,
                Lyrics = this.Lyrics,
                TotalPlays = this.TotalPlays,
                ReasonsPlayed = pickReasons,
                AlbumId = this.AlbumId,
                ArtistId = this.ArtistId,
                CommentCount = this.CommentCount
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
            return new Uri($"{url}/?song={this.Id}");
        }

        public string GetCommunityRankText()
        {
            if (this.CommunityRank > 0)
            {
                return $"+{this.CommunityRank}";
            }

            return this.CommunityRank.ToString();
        }
    }
}