using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace BitShuva.Chavah.Common
{
    public static class DictionaryExtensions
    {
        public static TValue GetValueOrDefault<TKey, TValue>(this Dictionary<TKey, TValue> dictionary, TKey key)
        {
            if (dictionary.TryGetValue(key, out TValue foundValue))
            {
                return foundValue;
            }

            return default(TValue);
        }

        /// <summary>
        /// Gets a value out of a dictionary by the specified key. If the key doesn't exist, null will be returned.
        /// </summary>
        /// <typeparam name="TKey"></typeparam>
        /// <typeparam name="TValue"></typeparam>
        /// <param name="dictionary"></param>
        /// <param name="key"></param>
        /// <returns></returns>
        public static TValue? GetValueOrNull<TKey, TValue>(this Dictionary<TKey, TValue> dictionary, TKey key)
            where TValue : struct
        {
            if (dictionary.TryGetValue(key, out TValue foundValue))
            {
                return foundValue;
            }

            return default(TValue?);
        }

        public static string ToKeyValuePairString<TKey, TValue>(this Dictionary<TKey, TValue> dictionary)
        {
            var builder = new StringBuilder(dictionary.Count * 20);
            var isFirst = true;
            foreach (var pair in dictionary)
            {
                if (!isFirst)
                {
                    builder.Append(',');
                    builder.Append(' ');
                }

                builder.Append('[');
                builder.Append(pair.Key.ToString());
                builder.Append(',');
                builder.Append(pair.Value?.ToString());
                builder.Append(']');

                if (isFirst)
                {
                    isFirst = false;
                }
            }

            return builder.ToString();
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