using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Web;

namespace BitShuva.Common
{
    public static class IEnumerableExtensions
    {
        static Random random = new Random();

        public static IEnumerable<IEnumerable<T>> Chunk<T>(this IEnumerable<T> items, int chunkSize)
        {
            var skip = 0;
            var chunk = items.Skip(skip).Take(chunkSize);
            var enumerator = chunk.GetEnumerator();
            while (enumerator.MoveNext())
            {
                yield return chunk;
                skip += chunkSize;
                chunk = items.Skip(skip).Take(chunkSize);
                enumerator = chunk.GetEnumerator();
            }
        }

        public static T RandomElement<T>(this IEnumerable<T> items)
        {
            var collection = items as ICollection<T>;
            if (collection == null)
            {
                collection = new List<T>(items);
            }

            if (collection.Count == 0)
            {
                return default(T);
            }

            var randomElementIndex = random.Next(0, collection.Count);
            return items.ElementAtOrDefault(randomElementIndex);
        }

        public static IEnumerable<T> Shuffle<T>(this IEnumerable<T> target)
        {
            return target.OrderBy(_ => Guid.NewGuid());
        }   
    }
}