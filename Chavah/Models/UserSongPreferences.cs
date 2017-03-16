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
        private const double VeryPoorRankingMultipler = 0.1;
        private const double PoorRankingMultipler = 0.5;
        private const double NormalRankingMultiplier = 1;
        private const double GoodRankingMultipler = 1.5;
        private const double GreatRankingMultipler = 2;
        private const double BestRankingMultipler = 3;

        private const double SongDislikedMultiplier = 0.1;
        private const double SongLikedMultipler = 2;

        private const double ArtistVeryDislikedMultiplier = 0.1;
        private const double ArtistDislikedMultiplier = 0.5;
        private const double ArtistLikedMultiplier = 1.1;
        private const double ArtistVeryLikedMultiplier = 1.5;
        private const double ArtistFavoriteMultiplier = 2;

        private const double AlbumVeryDislikedMultiplier = 0.1;
        private const double AlbumDislikedMultiplier = 0.5;
        private const double AlbumLikedMultiplier = 1.1;
        private const double AlbumVeryLikedMultiplier = 1.5;
        private const double AlbumFavoriteMultiplier = 2;

        private const double TagVeryDislikedMultiplier = 0.98;
        private const double TagDislikedMultiplier = 0.99;
        private const double TagLikedMultiplier = 1.01;
        private const double TagVeryLikedMultiplier = 1.02;
        private const double TagFavoriteMultiplier = 1.03;

        private static Random random = new Random();

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
        /// Picks a song based on the user's preferences, given a list of songs by community ranking.
        /// </summary>
        /// <param name="songsWithRanking"></param>
        /// <returns></returns>
        /// <remarks>
        /// Based off of the song weights algorithm described here:
        /// http://stackoverflow.com/questions/3345788/algorithm-for-picking-thumbed-up-items/3345838#3345838
        /// 
        /// The song weights algorithm is loosely based on the more general Multiplicative Weight Update Algorithm (MWUA), described here:
        /// https://jeremykun.com/2017/02/27/the-reasonable-effectiveness-of-the-multiplicative-weights-update-algorithm/
        /// </remarks>
        public SongPickReasons PickSong(IList<Songs_RankStandings.Result> songsWithRanking)
        {
            // Generate a table containing all the songs. The table will be a dictionary of SongID keys and weight values.
            // Each song takes up N weight, where N starts out as 1, but can grow or shrink depending on whether that song/artist/album/tags is liked or disliked.
            var totalSongCount = songsWithRanking.Sum(s => s.SongIds.Count);
            var songWeights = new Dictionary<string, double>(totalSongCount);
            foreach (var ranking in songsWithRanking)
            {
                var rankingMultipler = GetWeightMultiplier(ranking.Standing);
                foreach (var songId in ranking.SongIds)
                {
                    songWeights[songId] = 1 * rankingMultipler;
                }
            }

            // Now we've generated the table with all songs, each weighted according to their community ranking.
            // Next, adjust the weight based on whether we like this song or not.
            foreach (var likedSong in this.Songs)
            {
                if (songWeights.TryGetValue(likedSong.SongId, out var existingWeight))
                {
                    var songMultiplier = GetSongLikeDislikeMultiplier(likedSong);
                    songWeights[likedSong.SongId] = existingWeight * songMultiplier;
                }
            }

            // Next, adjust the weight based on whether we like this artist or not.
            var artistPrefs = this.Artists.GroupBy(a => a.Name);
            foreach (var artist in artistPrefs)
            {
                var artistMultiplier = GetArtistMultiplier(artist);
                if (artistMultiplier != 1.0)
                {
                    foreach (var pref in artist)
                    {
                        if (songWeights.TryGetValue(pref.SongId, out var existingWeight))
                        {
                            songWeights[pref.SongId] = existingWeight * artistMultiplier;
                        }
                    }
                }
            }

            // Next, adjust the weight based on whether we like this album or not.
            var albumPrefs = this.Albums.GroupBy(a => a.Name);
            foreach (var album in albumPrefs)
            {
                var albumMultiplier = GetAlbumMultiplier(album);
                if (albumMultiplier != 1.0)
                {
                    foreach (var pref in album)
                    {
                        if (songWeights.TryGetValue(pref.SongId, out var existingWeight))
                        {
                            songWeights[pref.SongId] = existingWeight * albumMultiplier;
                        }
                    }
                }
            }

            // Finally, adjust the weight based on whether we like the tags of the song or not.
            var tagPrefs = this.Tags.GroupBy(t => t.Name);
            foreach (var tag in tagPrefs)
            {
                var tagMultiplier = GetTagMultiplier(tag);
                if (tagMultiplier != 1.0)
                {
                    foreach (var pref in tag)
                    {
                        if (songWeights.TryGetValue(pref.SongId, out var existingWeight))
                        {
                            songWeights[pref.SongId] = existingWeight * tagMultiplier;
                        }
                    }
                }
            }

            // We've now completed creating our table of all songs, weighted by popularity and user preference.
            // Pick a number at random from zero to total song weights, and choose that song.
            var totalSongWeights = songWeights.Values.Sum();
            var randomNumber = random.NextDouble() * totalSongWeights;
            var runningWeight = 0.0;
            var chosenSongId = default(string);
            foreach (var pair in songWeights)
            {
                runningWeight += pair.Value;
                if (randomNumber <= runningWeight)
                {
                    chosenSongId = pair.Key;
                    break;
                }
            }

            // TODO: We should roll the song pick reasons into the table above, rather than re-fetching the reasons in GetSongPickReasons.
            return GetSongPickReasons(chosenSongId, songsWithRanking);
        }

        private SongPickReasons GetSongPickReasons(string songId, IList<Songs_RankStandings.Result> songsWithRanking)
        {
            var sum = new Func<LikeDislikeCount, int>(a => a.LikeCount - a.DislikeCount);
            var artistDiff = this.Artists
                .Where(a => a.SongId == songId).Sum(sum);
            var albumDiff = this.Albums
                .Where(a => a.SongId == songId).Sum(sum);
            var songDiff = this.Songs
                .Where(s => s.SongId == songId).Sum(sum);
            var tagDiffs = this.Tags
                .Where(t => t.SongId == songId)
                .GroupBy(t => t.Name)
                .Select(t => (tag: t.Key, sum: t.Sum(sum)));
            var isBestStanding = songsWithRanking.Any(r => r.Standing == CommunityRankStanding.Best && r.SongIds.Contains(songId));
            var isGreatStanding = !isBestStanding && songsWithRanking.Any(r => r.Standing == CommunityRankStanding.Great && r.SongIds.Contains(songId));
            var isGoodStanding = !isBestStanding && !isGreatStanding && songsWithRanking.Any(r => r.Standing == CommunityRankStanding.Good && r.SongIds.Contains(songId));
            var like = 1;
            var love = 5;
            return new SongPickReasons
            {
                LikedAlbum = albumDiff < love && albumDiff >= like,
                LovedAlbum = albumDiff >= love,
                LikedArtist = artistDiff < love && artistDiff >= like,
                LovedArtist = artistDiff >= love,
                LikedSong = songDiff > 0,
                SongId = songId,
                LikedTags = tagDiffs.Where(t => t.sum < love && t.sum >= like).Select(t => t.tag).ToList(),
                LovedTags = tagDiffs.Where(t => t.sum >= love).Select(t => t.tag).ToList(),
                BestRanking = isBestStanding,
                GreatRanking = isGreatStanding,
                GoodRanking = isGoodStanding
            };
        }

        private static double GetTagMultiplier(IGrouping<string, LikeDislikeCount> tag)
        {
            var likeDislikeDifference = tag.Sum(t => t.LikeCount - t.DislikeCount);
            const int veryDislikedDiff = -5;
            const int dislikedDiff = -2;
            const int likedDiff = 2;
            const int veryLikedDiff = 10;
            const int favoriteDiff = 20;

            switch (likeDislikeDifference)
            {
                case int i when (i >= favoriteDiff): return TagFavoriteMultiplier;
                case int i when (i >= veryLikedDiff): return TagVeryLikedMultiplier;
                case int i when (i >= likedDiff): return TagLikedMultiplier;
                case int i when (i <= veryDislikedDiff): return TagVeryDislikedMultiplier;
                case int i when (i <= dislikedDiff): return TagDislikedMultiplier;
                default: return 1;
            }
        }

        private static double GetAlbumMultiplier(IGrouping<string, LikeDislikeCount> album)
        {
            var likeDislikeDifference = album.Sum(a => a.LikeCount - a.DislikeCount);
            const int veryDislikedDiff = -4;
            const int dislikedDiff = -1;
            const int likedDiff = 1;
            const int veryLikedDiff = 4;
            const int favoriteDiff = 10;

            switch (likeDislikeDifference)
            {
                case int i when (i >= favoriteDiff): return AlbumFavoriteMultiplier;
                case int i when (i >= veryLikedDiff): return AlbumVeryLikedMultiplier;
                case int i when (i >= likedDiff): return AlbumLikedMultiplier;
                case int i when (i <= veryDislikedDiff): return AlbumVeryDislikedMultiplier;
                case int i when (i <= dislikedDiff): return AlbumDislikedMultiplier;
                default: return 1;
            }
        }

        private static double GetArtistMultiplier(IGrouping<string, LikeDislikeCount> artist)
        {
            var likeDislikeDifference = artist.Sum(a => a.LikeCount - a.DislikeCount);
            const int veryDislikedDiff = -5;
            const int dislikedDiff = -2;
            const int likedDiff = 2;
            const int veryLikedDiff = 5;
            const int favoriteDiff = 10;

            switch (likeDislikeDifference)
            {
                case int i when (i >= favoriteDiff): return ArtistFavoriteMultiplier;
                case int i when (i >= veryLikedDiff): return ArtistVeryLikedMultiplier;
                case int i when (i >= likedDiff): return ArtistLikedMultiplier;
                case int i when (i <= veryDislikedDiff): return ArtistVeryDislikedMultiplier;
                case int i when (i <= dislikedDiff): return ArtistDislikedMultiplier;
                default: return 1;
            }
        }

        private static double GetSongLikeDislikeMultiplier(LikeDislikeCount songPref)
        {
            if (songPref.LikeCount == 1)
            {
                return SongLikedMultipler;
            }
            else if (songPref.DislikeCount == 1)
            {
                return SongDislikedMultiplier;
            }

            return 1;
        }

        private static double GetWeightMultiplier(CommunityRankStanding ranking)
        {
            switch (ranking)
            {
                case CommunityRankStanding.Normal: return NormalRankingMultiplier;
                case CommunityRankStanding.VeryPoor: return VeryPoorRankingMultipler;
                case CommunityRankStanding.Poor: return PoorRankingMultipler;
                case CommunityRankStanding.Good: return GoodRankingMultipler;
                case CommunityRankStanding.Great: return GreatRankingMultipler;
                case CommunityRankStanding.Best: return BestRankingMultipler;
                default: return NormalRankingMultiplier;
            }
        }

        /// <summary>
        /// Picks a song for the user based his music preferences.
        /// </summary>
        /// <param name="totalSongCount">The total number of songs.</param>
        /// <returns></returns>
        public SongPick OldPickSong(int veryPoorRankedSongCount, int poorRankedSongCount, int normalRankedSongCount, int goodRankedSongCount, int greatRankedSongCount, int bestRankedSongCount)
        {
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