using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BitShuva.Common;
using BitShuva.Models.Indexes;

namespace BitShuva.Models
{
    /// <summary>
    /// Contains information about a user's song preferences, based on songs, artists, albums, and tags.
    /// </summary>
    public class UserSongPreferences
    {
        static Random random = new Random();

        public UserSongPreferences()
        {
            Artists = new List<LikeDislikeCount>();
            Albums = new List<LikeDislikeCount>();
            Songs = new List<LikeDislikeCount>();
            Tags = new List<LikeDislikeCount>();
        }

        public string UserId { get; set; }
        public List<LikeDislikeCount> Artists { get; set; }
        public List<LikeDislikeCount> Albums { get; set; }
        public List<LikeDislikeCount> Songs { get; set; }
        public List<LikeDislikeCount> Tags { get; set; }

        /// <summary>
        /// Picks a song for the user based his music preferences.
        /// </summary>
        /// <param name="totalSongCount">The total number of songs.</param>
        /// <returns></returns>
        public SongPick OldPickSong(int veryPoorRankedSongCount, int poorRankedSongCount, int normalRankedSongCount, int goodRankedSongCount, int greatRankedSongCount, int bestRankedSongCount)
        {
            // Based off of the song weights algorithm described here:
            // http://stackoverflow.com/questions/3345788/algorithm-for-picking-thumbed-up-items/3345838#3345838
            // 
            // The song weights algorithm is loosely based on the more general Multiplicative Weight Update Algorithm (MWUA), described here:
            // https://jeremykun.com/2017/02/27/the-reasonable-effectiveness-of-the-multiplicative-weights-update-algorithm/

            var veryPoorRange = new Range(0, .001 * veryPoorRankedSongCount);
            var poorRange = new Range(veryPoorRange.End, .01 * poorRankedSongCount);
            var normalRange = new Range(poorRange.End, normalRankedSongCount);
            var goodRange = new Range(normalRange.End, 2 * goodRankedSongCount);
            var greatRange = new Range(goodRange.End, 3 * greatRankedSongCount);
            var bestRange = new Range(greatRange.End, 4 * bestRankedSongCount);
            
            var likedSongRange = new Range(bestRange.End, 4 * this.Songs.Count(s => s.LikeCount == 1));
            var likedAlbumRange = new Range(likedSongRange.End, 3 * GetLikedAlbums().Count());
            var likedArtistRange = new Range(likedAlbumRange.End, 3 * GetLikedArtists().Count());

            var totalRange = likedArtistRange.End;
            var randomRange = random.Range(totalRange);

            return Match.Value(randomRange)
                .With(0, SongPick.RandomSong)
                .With(veryPoorRange.IsWithinRange, SongPick.VeryPoorRank)
                .With(poorRange.IsWithinRange, SongPick.PoorRank)
                .With(normalRange.IsWithinRange, SongPick.NormalRank)
                .With(goodRange.IsWithinRange, SongPick.GoodRank)
                .With(greatRange.IsWithinRange, SongPick.GreatRank)
                .With(bestRange.IsWithinRange, SongPick.BestRank)
                .With(likedSongRange.IsWithinRange, SongPick.LikedSong)
                .With(likedAlbumRange.IsWithinRange, SongPick.LikedAlbum)
                .With(likedArtistRange.IsWithinRange, SongPick.LikedArtist)
                .DefaultTo(SongPick.RandomSong);
        }

        public void Update(Song song, LikeStatus likeStatus)
        {
            UpdateSongs(song, likeStatus);
            UpdateArtists(song, likeStatus);
            UpdateAlbums(song, likeStatus);
        }

        public LikeStatus GetLikeStatus(Song song)
        {
            var songPreference = this.Songs.FirstOrDefault(s => s.Name == song.Id);
            return Match
                .Value(songPreference)
                .With(default(LikeDislikeCount), LikeStatus.None)
                .With(l => l.LikeCount == 1, LikeStatus.Like)
                .With(l => l.DislikeCount == 1, LikeStatus.Dislike);
        }

        public IEnumerable<LikeDislikeCount> GetLikedAlbums()
        {
            return this.Albums.Where(a => a.LikeCount > 5 && a.DislikeCount <= 1);
        }

        public IEnumerable<LikeDislikeCount> GetLikedArtists()
        {
            return this.Artists.Where(a => a.LikeCount > 10 && a.DislikeCount <= 3);
        }

        public IEnumerable<LikeDislikeCount> GetDislikedSongs()
        {
            return this.Songs.Where(a => a.DislikeCount == 1);
        }

        private void UpdateSongs(Song song, LikeStatus likeStatus)
        {
            var existingLike = this.Songs.FirstOrDefault(s => s.Name == song.Id);
            if (existingLike != null)
            {
                existingLike.LikeCount = likeStatus == LikeStatus.Like ? 1 : 0;
                existingLike.DislikeCount = likeStatus == LikeStatus.Dislike ? 1 : 0;
            }
            else
            {
                this.Songs.Add(new LikeDislikeCount
                {
                    Name = song.Id,
                    LikeCount = likeStatus == LikeStatus.Like ? 1 : 0,
                    DislikeCount = likeStatus == LikeStatus.Dislike ? 1 : 0
                });
            }
        }

        private void UpdateArtists(Song song, LikeStatus likeStatus)
        {
            var existing = this.Artists.FirstOrDefault(s => s.Name == song.Artist);
            if (existing != null)
            {
                existing.LikeCount = likeStatus == LikeStatus.Like ? existing.LikeCount + 1 : existing.LikeCount;
                existing.DislikeCount = likeStatus == LikeStatus.Dislike ? existing.DislikeCount + 1 : existing.DislikeCount;
            }
            else
            {
                this.Artists.Add(new LikeDislikeCount
                {
                    Name = song.Artist,
                    LikeCount = likeStatus == LikeStatus.Like ? 1 : 0,
                    DislikeCount = likeStatus == LikeStatus.Dislike ? 1 : 0
                });
            }
        }

        private void UpdateAlbums(Song song, LikeStatus likeStatus)
        {
            var existing = this.Albums.FirstOrDefault(s => s.Name == song.Album);
            if (existing != null)
            {
                existing.LikeCount = likeStatus == LikeStatus.Like ? existing.LikeCount + 1 : existing.LikeCount;
                existing.DislikeCount = likeStatus == LikeStatus.Dislike ? existing.DislikeCount + 1 : existing.DislikeCount;
            }
            else
            {
                this.Albums.Add(new LikeDislikeCount
                {
                    Name = song.Album,
                    LikeCount = likeStatus == LikeStatus.Like ? 1 : 0,
                    DislikeCount = likeStatus == LikeStatus.Dislike ? 1 : 0
                });
            }
        }
    }
}