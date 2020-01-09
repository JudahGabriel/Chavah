using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

using Raven.Client.Documents;

namespace BitShuva.Chavah.Common
{
    public static class SequenceExtensions
    {
        private static readonly Random Random = new Random();

        public static Task<TSource?> FirstOrNoneAsync<TSource>(this IQueryable<TSource> source)
            where TSource : class
        {
            return source.FirstOrDefaultAsync() as Task<TSource?>;
        }

        public static Task<TSource?> FirstOrNoneAsync<TSource>(this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
            where TSource : class
        {
            return source.Where(predicate).FirstOrNoneAsync();
        }
        
        public static T? RandomElement<T>(this IEnumerable<T> items)
            where T : class
        {
            var count = items.Count();
            if (count == 0)
            {
                return default;
            }
            
            var randomElementIndex = Random.Next(0, count);
            return items.ElementAtOrDefault(randomElementIndex);
        }
    }
}
