using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Linq.Expressions;
using System.Diagnostics.Contracts;
using System.Collections.Concurrent;
using BitShuva.Chavah.Models;
using System.Text;
using System.Threading.Tasks;
using Optional;
using Optional.Async;

namespace BitShuva.Chavah.Common
{
    public static class Extensions
    {
        public static double Clamp(this double value, double min, double max)
        {
            var valMinned = Math.Max(value, min);
            var valMinnedAndMaxed = Math.Min(valMinned, max);
            return valMinnedAndMaxed;
        }

        public static double Range(this Random random, double max)
        {
            return random.NextDouble() * max;
        }

        /// <summary>
        /// Converts a Like database object into a SongLike enum.
        /// This is an extension method; if the Like object is null,
        /// this will return SongLike.None. 
        /// </summary>
        /// <param name="like"></param>
        /// <returns>
        /// If the Like object is null, it returns SongLike.None.
        /// Otherwise, it returns the Like.LikeStatus converted to a SongLike enum.
        /// </returns>
        public static LikeStatus StatusOrNone(this Like like)
        {
            if (like == null)
            {
                return LikeStatus.None;
            }

            return like.Status;
        }

        /// <summary>
        /// Combines a URI with multiple paths or file names.
        /// </summary>
        /// <param name="uri">The URI.</param>
        /// <param name="paths">The paths to combine onto the URI.</param>
        /// <returns>A new URI containing the root and paths appended to it.</returns>
        public static Uri Combine(this Uri uri, params string[] paths)
        {
            // We really need a Path.Combine for URIs. http://stackoverflow.com/questions/372865/path-combine-for-urls
            var rootUriString = uri.ToString().TrimEnd('/');
            var builder = new StringBuilder(rootUriString.Length + paths.Sum(p => p.Length));
            builder.Append(uri.ToString().TrimEnd('/'));
            foreach (var path in paths)
            {
                builder.Append('/');
                builder.Append(path);
            }
            return new Uri(builder.ToString());
        }

        /// <summary>
        /// Converts 1 to "1st", 2 to "2nd", etc.
        /// </summary>
        /// <param name="number"></param>
        /// <returns></returns>
        public static string ToNumberWord(this int number)
        {
            if (number <= 0)
            {
                return "1st";
            }

            switch (number % 100)
            {
                case 11:
                case 12:
                case 13:
                    return number.ToString() + "th";
            }

            switch (number % 10)
            {
                case 1:
                    return number.ToString() + "st";
                case 2:
                    return number.ToString() + "nd";
                case 3:
                    return number.ToString() + "rd";
                default:
                    return number.ToString() + "th";
            }
        }
    }
}