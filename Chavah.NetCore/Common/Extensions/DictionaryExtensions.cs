using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace BitShuva.Chavah.Common
{
    public static class DictionaryExtensions
    {
        /// <summary>
        /// Gets a value out of a dictionary by the specified key. If the key doesn't exist, null will be returned.
        /// </summary>
        /// <typeparam name="TKey"></typeparam>
        /// <typeparam name="TValue"></typeparam>
        /// <param name="dictionary"></param>
        /// <param name="key"></param>
        /// <returns></returns>
        public static TValue? GetValueOrNull<TKey, TValue>(this Dictionary<TKey, TValue> dictionary, TKey key)
            where TKey : notnull
            where TValue : struct
        {
            if (dictionary.TryGetValue(key, out var foundValue))
            {
                return foundValue;
            }

            return default;
        }

        public static string ToKeyValuePairString<TKey, TValue>(this Dictionary<TKey, TValue> dictionary)
            where TKey : notnull
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
                builder.Append(pair.Key?.ToString() ?? string.Empty);
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
            where TKey : notnull
        {
            var keys = dictionary.Keys.Take(maxRemove).ToList();
            var results = new List<Tuple<TKey, TValue>>();
            while (keys.Count > 0)
            {
                var key = keys[0];
                keys.RemoveAt(0);

                if (dictionary.TryRemove(key, out var val))
                {
                    results.Add(Tuple.Create(key, val));
                }
            }

            return results;
        }
    }
}
