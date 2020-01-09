﻿using System;
using System.Collections.Generic;
using System.Linq;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models.Indexes;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// Contains information about a user's song preferences, based on songs, artists, albums, and tags.
    /// </summary>
    public class UserSongPreferences
    {
        private const double VeryPoorRankingMultipler = 0.1;
        private const double PoorRankingMultipler = 0.5;
        private const double NormalRankingMultiplier = 1;
        private const double GoodRankingMultipler = 2;
        private const double GreatRankingMultipler = 3;
        private const double BestRankingMultipler = 4;

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

        private const double TagVeryDislikedMultiplier = 0.1;
        private const double TagDislikedMultiplier = 0.5;
        private const double TagLikedMultiplier = 1.1;
        private const double TagVeryLikedMultiplier = 1.5;
        private const double TagFavoriteMultiplier = 2;

        private const double AgeMultiplier4 = 4;
        private const double AgeMultiplier3 = 3;
        private const double AgeMultiplier2 = 2;
        private const double AgeMultiplierNormal = 1;

        private static readonly Random _random = new Random();
        
        public string UserId { get; set; } = string.Empty;
        public List<LikeDislikeCount> Artists { get; set; } = new List<LikeDislikeCount>();
        public List<LikeDislikeCount> Albums { get; set; } = new List<LikeDislikeCount>();
        public List<LikeDislikeCount> Songs { get; set; } = new List<LikeDislikeCount>();
        public List<LikeDislikeCount> Tags { get; set; } = new List<LikeDislikeCount>();

        /// <summary>
        /// Picks a song based on the user's preferences, given a list of songs by community ranking.
        /// </summary>
        /// <param name="songsWithRanking">Songs grouped by community rank standing.</param>
        /// <returns></returns>
        /// <remarks>
        /// <para>
        /// Based off of the song weights algorithm described here:
        /// http://stackoverflow.com/questions/3345788/algorithm-for-picking-thumbed-up-items/3345838#3345838
        /// </para>
        /// <para>
        /// The song weights algorithm is loosely based on the more general Multiplicative Weight Update Algorithm (MWUA), described here:
        /// https://jeremykun.com/2017/02/27/the-reasonable-effectiveness-of-the-multiplicative-weights-update-algorithm/
        /// </para>
        /// </remarks>
        public SongPickReasons PickSong(IList<Songs_RankStandings.Result> songsWithRanking)
        {
            // The song picking algorithm is inside BuildSongWeightsTable.
            var songWeights = BuildSongWeightsTable(songsWithRanking);

            // Pick a number at random from zero to total song weights, and choose that song.
            var totalSongWeights = songWeights.Values.Sum(w => w.Weight);
            var randomNumber = _random.NextDouble() * totalSongWeights;
            var runningWeight = 0.0;
            var chosenSong = default(KeyValuePair<string, SongWeight>);
            foreach (var pair in songWeights)
            {
                runningWeight += pair.Value.Weight;
                if (randomNumber <= runningWeight)
                {
                    chosenSong = pair;
                    break;
                }
            }

            // Return an object containing the song choice and the reasons for choosing it.
            var chosenSongWeight = chosenSong.Value;
            return new SongPickReasons
            {
                SongId = chosenSong.Key,
                Album = MultiplierToLikeLevel(chosenSongWeight.AlbumMultiplier, AlbumFavoriteMultiplier, AlbumVeryLikedMultiplier, AlbumLikedMultiplier),
                Artist = MultiplierToLikeLevel(chosenSongWeight.ArtistMultiplier, ArtistFavoriteMultiplier, ArtistVeryLikedMultiplier, ArtistLikedMultiplier),
                Similar = MultiplierToLikeLevel(chosenSongWeight.TagMultiplier, TagFavoriteMultiplier, TagVeryLikedMultiplier, TagLikedMultiplier),
                Ranking = MultiplierToLikeLevel(chosenSongWeight.CommunityRankMultiplier, BestRankingMultipler, GreatRankingMultipler, GoodRankingMultipler),
                SongThumbedUp = chosenSongWeight.SongMultiplier == SongLikedMultipler
            };
        }

        /// <summary>
        /// Builds a dictionary containing Song ID keys and weight values.
        /// The weight values are determined by song popularity, song like, artist like, album like, and tag like.
        /// </summary>
        /// <param name="songsWithRanking">Songs grouped by community rank standing.</param>
        /// <returns></returns>
        /// <remarks>
        /// Based off of the song weights algorithm described here:
        /// http://stackoverflow.com/questions/3345788/algorithm-for-picking-thumbed-up-items/3345838#3345838
        ///
        /// The song weights algorithm is loosely based on the more general Multiplicative Weight Update Algorithm (MWUA), described here:
        /// https://jeremykun.com/2017/02/27/the-reasonable-effectiveness-of-the-multiplicative-weights-update-algorithm/
        /// </remarks>
        internal Dictionary<string, SongWeight> BuildSongWeightsTable(IList<Songs_RankStandings.Result> songsWithRanking)
        {
            // Generate a table containing all the songs. The table will be a dictionary of SongID keys and weight values.
            // Each song takes up N weight, where N starts out as 1, but can grow or shrink depending on whether that song/artist/album/tags is liked or disliked.
            var totalSongCount = songsWithRanking.Sum(s => s.SongIds.Count);
            var songWeights = new Dictionary<string, SongWeight>(totalSongCount);
            foreach (var ranking in songsWithRanking)
            {
                var rankingMultipler = GetWeightMultiplier(ranking.Standing);
                var songIdsAndDates = ranking.SongIds.Zip(ranking.SongUploadDates);
                foreach (var (songId, date) in songIdsAndDates)
                {
                    // Give it a weight based on its community rank.
                    // Multiply that weight by the song's age (newer songs are played more often.)
                    var ageMultiplier = GetAgeMultiplier(date);
                    var rankAndAgeWeight = SongWeight.Default()
                        .WithCommunityRankMultiplier(rankingMultipler)
                        .WithAgeMultiplier(ageMultiplier);

                    songWeights[songId] = rankAndAgeWeight;
                }
            }

            // Now we've generated the table with all songs, each weighted according to their community ranking.
            // Next, adjust the weight based on whether we like this song or not.
            foreach (var likedSong in Songs)
            {
                if (songWeights.TryGetValue(likedSong.SongId, out var existingWeight))
                {
                    var songMultiplier = GetSongLikeDislikeMultiplier(likedSong);
                    songWeights[likedSong.SongId] = existingWeight.WithSongMultiplier(songMultiplier);
                }
            }

            // Next, adjust the weight based on whether we like this artist or not.
            var artistPrefs = Artists.GroupBy(a => a.Name);
            foreach (var artist in artistPrefs)
            {
                var artistMultiplier = GetArtistMultiplier(artist);
                if (artistMultiplier != 1.0)
                {
                    foreach (var pref in artist)
                    {
                        if (songWeights.TryGetValue(pref.SongId, out var existingWeight))
                        {
                            songWeights[pref.SongId] = existingWeight.WithArtistMultiplier(artistMultiplier);
                        }
                    }
                }
            }

            // Next, adjust the weight based on whether we like this album or not.
            var albumPrefs = Albums.GroupBy(a => a.Name);
            foreach (var album in albumPrefs)
            {
                var albumMultiplier = GetAlbumMultiplier(album);
                if (albumMultiplier != 1.0)
                {
                    foreach (var pref in album)
                    {
                        if (songWeights.TryGetValue(pref.SongId, out var existingWeight))
                        {
                            songWeights[pref.SongId] = existingWeight.WithAlbumMultiplier(albumMultiplier);
                        }
                    }
                }
            }

            // Adjust the weight based on whether we like the tags of the song or not.
            var tagLikeDislikeDifferences = CreateTagLikeDislikeDifferences(Tags);
            var songTags = Tags.GroupBy(t => t.SongId);
            var songsWithTagMultipliers = songTags.Select(tag => (SongId: tag.Key, TagsMultiplier: GetCumulativeTagMultiplier(tag, tagLikeDislikeDifferences)));
            foreach (var (SongId, TagsMultiplier) in songsWithTagMultipliers)
            {
                if (songWeights.TryGetValue(SongId, out var existingWeight))
                {
                    songWeights[SongId] = existingWeight.WithTagMultiplier(TagsMultiplier);
                }
            }

            return songWeights;
        }        

        /// <summary>
        /// Creates a dictionary of tag name keys and like/dislike sum values. (Sum: a tag like = 1, a tag dislike = -1).
        /// </summary>
        /// <remarks>
        /// For example, given the following tags:
        ///    { Tag: "worship", LikeDislikeCount: 1, SongId: "songs/777" } // user liked song/777 which is tagged "worship"
        ///    { Tag: "worship", LikeDislikeCount: -1, SongId: "songs/666" } // user disliked song/666, which is tagged "worship"
        ///    { Tag: "male vocal", LikeDislikeCount: 1, SongId: "songs/444" } // user liked song/444, which is taggged "male vocal"
        ///
        /// The output will be a dictionary containing these pairs:
        ///     { Key: "worship", Value: 0 } // 0 because 1 + -1 = 0
        ///     { Key: "male vocal", Value: 1 }
        /// </remarks>
        /// <param name="tags">All tag like/dislikes.</param>
        /// <returns></returns>
        private static Dictionary<string, int> CreateTagLikeDislikeDifferences(List<LikeDislikeCount> tags)
        {
            return tags.GroupBy(t => t.Name)
                .ToDictionary(t => t.Key, i => i.Sum(l => l.LikeCount - l.DislikeCount));
        }

        /// <summary>
        /// Gets a song rank multiplier for a song given the multipliers for the tags for the song.
        /// </summary>
        private static double GetCumulativeTagMultiplier(IEnumerable<LikeDislikeCount> songTagLikes, Dictionary<string, int> tagLikeDislikeDifferences)
        {
            var songTagLikeDifferences = songTagLikes
                .GroupBy(t => t.Name)
                .Select(group => (Tag: group.Key, LikeDislikeDifference: tagLikeDislikeDifferences.GetValueOrNull(group.Key).GetValueOrDefault()));

            static double DifferenceToMultiplier(int difference)
            {
                const int veryDislikedDiff = -10; // Sum of likes and dislikes = -10? Consider the tag very disliked.
                const int dislikedDiff = -5;
                const int likedDiff = 5;
                const int veryLikedDiff = 10;
                const int favoriteDiff = 20;
                return difference switch
                {
                    int i when (i >= favoriteDiff) => TagFavoriteMultiplier,
                    int i when (i >= veryLikedDiff) => TagVeryLikedMultiplier,
                    int i when (i >= likedDiff) => TagLikedMultiplier,
                    int i when (i <= veryDislikedDiff) => TagVeryDislikedMultiplier,
                    int i when (i <= dislikedDiff) => TagDislikedMultiplier,
                    _ => 1, // The tag is neither liked nor disliked. Return a neutral multiplier.
                };
            };

            var runningMultiplier = 1.0;
            foreach (var (Tag, LikeDislikeDifference) in songTagLikeDifferences)
            {
                var tagMultiplier = DifferenceToMultiplier(LikeDislikeDifference);
                runningMultiplier *= tagMultiplier;
            }

            // Clamp the multiplier.
            var clamped = runningMultiplier.Clamp(TagVeryDislikedMultiplier, TagFavoriteMultiplier);
            return clamped;
        }

        private static LikeLevel MultiplierToLikeLevel(double multiplier, double favoriteMultiplier, double loveMultiplier, double likeMultiplier)
        {
            return multiplier switch
            {
                double v when (v == favoriteMultiplier) => LikeLevel.Favorite,
                double v when (v == loveMultiplier) => LikeLevel.Love,
                double v when (v == likeMultiplier) => LikeLevel.Like,
                _ => LikeLevel.NotSpecified,
            };
        }

        private static double GetAlbumMultiplier(IGrouping<string, LikeDislikeCount> album)
        {
            var likeDislikeDifference = album.Sum(a => a.LikeCount - a.DislikeCount);
            const int veryDislikedDiff = -4;
            const int dislikedDiff = -2;
            const int likedDiff = 2;
            const int veryLikedDiff = 4;
            const int favoriteDiff = 10;

            return likeDislikeDifference switch
            {
                int i when (i >= favoriteDiff) => AlbumFavoriteMultiplier,
                int i when (i >= veryLikedDiff) => AlbumVeryLikedMultiplier,
                int i when (i >= likedDiff) => AlbumLikedMultiplier,
                int i when (i <= veryDislikedDiff) => AlbumVeryDislikedMultiplier,
                int i when (i <= dislikedDiff) => AlbumDislikedMultiplier,
                _ => 1,
            };
        }

        private static double GetArtistMultiplier(IGrouping<string, LikeDislikeCount> artist)
        {
            var likeDislikeDifference = artist.Sum(a => a.LikeCount - a.DislikeCount);
            const int veryDislikedDiff = -5;
            const int dislikedDiff = -2;
            const int likedDiff = 2;
            const int veryLikedDiff = 5;
            const int favoriteDiff = 10;

            return likeDislikeDifference switch
            {
                var i when (i >= favoriteDiff) => ArtistFavoriteMultiplier,
                var i when (i >= veryLikedDiff) => ArtistVeryLikedMultiplier,
                var i when (i >= likedDiff) => ArtistLikedMultiplier,
                var i when (i <= veryDislikedDiff) => ArtistVeryDislikedMultiplier,
                var i when (i <= dislikedDiff) => ArtistDislikedMultiplier,
                _ => 1,
            };
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
            return ranking switch
            {
                CommunityRankStanding.Normal => NormalRankingMultiplier,
                CommunityRankStanding.VeryPoor => VeryPoorRankingMultipler,
                CommunityRankStanding.Poor => PoorRankingMultipler,
                CommunityRankStanding.Good => GoodRankingMultipler,
                CommunityRankStanding.Great => GreatRankingMultipler,
                CommunityRankStanding.Best => BestRankingMultipler,
                _ => NormalRankingMultiplier,
            };
        }

        private static double GetAgeMultiplier(DateTime date)
        {
            var lastWeek = DateTime.UtcNow.Subtract(TimeSpan.FromDays(7));
            var lastMonth = DateTime.UtcNow.Subtract(TimeSpan.FromDays(31));
            var lastYear = DateTime.UtcNow.Subtract(TimeSpan.FromDays(365));
            return date switch
            {
                var d when (d >= lastWeek) => AgeMultiplier4,
                var d when (d >= lastMonth) => AgeMultiplier3,
                var d when (d >= lastYear) => AgeMultiplier2,
                _ => AgeMultiplierNormal
            };
        }
    }
}
