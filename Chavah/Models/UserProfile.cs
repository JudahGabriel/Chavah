using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BitShuva.Common;

namespace BitShuva.Models
{
    public class UserProfile
    {
        public UserProfile()
        {
        }

        public UserProfile(User user, List<string> favoriteSongNames)
	    {
            this.DislikedSongCount = user.Preferences.Songs.Count(s => s.DislikeCount > 0);
            this.EmailAddress = user.EmailAddress;
            this.FavoriteAlbums = user.Preferences
                .Albums
                .OrderByDescending(a => a.LikeCount - a.DislikeCount)
                .Take(5)
                .ToList();
            this.FavoriteArtists = user.Preferences
                .Artists
                .OrderByDescending(a => a.LikeCount - a.DislikeCount)
                .Take(5)
                .ToList();
            this.FavoriteSongs = favoriteSongNames;
            this.LikedSongCount = user.Preferences.Songs.Count(s => s.LikeCount > 0);
            this.TotalPlays = user.TotalPlays;
            this.RegistrationDate = user.RegistrationDate;

            this.Rank = CalculateRank();
	    }

        public DateTime RegistrationDate { get; set; }
        public int TotalPlays { get; set; }
        public int DislikedSongCount { get; set; }
        public int LikedSongCount { get; set; }
        public List<LikeDislikeCount> FavoriteArtists { get; set; }
        public List<LikeDislikeCount> FavoriteAlbums { get; set; }
        public List<string> FavoriteSongs { get; set; }
        public int Rank { get; set; }
        public string EmailAddress { get; set; }

        private int CalculateRank()
        {
            var totalLikes = this.LikedSongCount;
            var totalDislikes = this.DislikedSongCount;
            if (this.TotalPlays > 50000 && totalLikes > 100 && totalDislikes > 10) {
                return 6;
            } else if (this.TotalPlays > 20000 && totalLikes > 50 && totalDislikes > 5) {
                return 5;
            } else if (this.TotalPlays > 10000 && totalLikes > 30 && totalDislikes > 1) {
                return 4;
            } else if (this.TotalPlays > 5000 && totalLikes > 20) {
                return 3;
            } else if (this.TotalPlays > 1000 && totalLikes > 10) {
                return 2;
            } else if (this.TotalPlays > 250 && totalLikes > 0) {
                return 1;
            } 

            return 0;
        }
    }
}