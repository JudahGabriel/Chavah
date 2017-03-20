using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Linq.Expressions;
using System.Diagnostics.Contracts;
using System.Collections.Concurrent;
using BitShuva.Models;
using System.Text;
using System.Threading.Tasks;

namespace BitShuva.Common
{
    public static class Extensions
    {
        public static double MinMax(this double value, double min, double max)
        {
            var valMinned = Math.Max(value, min);
            var valMinnedAndMaxed = Math.Min(valMinned, max);
            return valMinnedAndMaxed;
        }

        public static bool Contains(this string value, string substring, StringComparison comparison)
        {
            return value.IndexOf(substring, comparison) != -1;
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

        public static bool IsAny(this string text, StringComparison comparison, params string[] others)
        {
            return others.Any(s => string.Equals(text, s, comparison));
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

        /// <summary>
        /// Adds an expiration time to the raven document for the specified object.
        /// The database must support the expiration bundle for this to have any effect.
        /// The object set to expire must have already been .Store'd before calling this method.
        /// </summary>
        /// <param name="session">The raven document session.</param>
        /// <param name="objectToExpire">The object to expire.</param>
        /// <param name="dateTime">The expiration date time.</param>
        public static void AddRavenExpiration(this Raven.Client.IAsyncDocumentSession session, object objectToExpire, DateTime dateTime)
        {
            session.Advanced.GetMetadataFor(objectToExpire)["Raven-Expiration-Date"] = new Raven.Json.Linq.RavenJValue(dateTime);
        }

        /// <summary>
        /// Loads an entity from Raven. If the entity is null, an ArgumentException is thrown.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<T> LoadNonNull<T>(this Raven.Client.IAsyncDocumentSession session, string id)
        {
            var doc = await session.LoadAsync<T>(id);
            if (doc == null)
            {
                throw new ArgumentException($"Tried to load document {id}, but it was null.");
            }

            return doc;
        }

        public static List<Tuple<TKey, TValue>> TryRemoveMultiple<TKey, TValue>(this ConcurrentDictionary<TKey, TValue> dictionary, int maxRemove)
        {
            var keys = dictionary.Keys.Take(maxRemove).ToList();
            var results = new List<Tuple<TKey, TValue>>();
            while (keys.Count > 0)
            {
                var key = keys[0];
                keys.RemoveAt(0);
                var val = default(TValue);
                if (dictionary.TryRemove(key, out val))
                {
                    results.Add(Tuple.Create(key, val));
                }
            }

            return results;
        }
    }
}