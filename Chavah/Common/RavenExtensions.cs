using Optional;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Optional.Async;

namespace BitShuva.Common
{
    public static class RavenExtensions
    {
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
        public static async Task<T> LoadNonNull<T>(this IAsyncDocumentSession session, string id)
        {
            var doc = await session.LoadAsync<T>(id);
            if (doc == null)
            {
                throw new ArgumentException($"Tried to load document {id}, but it was null.");
            }

            return doc;
        }

        /// <summary>
        /// Loads a possibly null document as an Option.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<Option<T>> LoadOption<T>(this IAsyncDocumentSession session, string id)
        {
            var doc = await session.LoadAsync<T>(id);
            return doc.SomeNotNull();
        }

        /// <summary>
        /// Returns the first match as an Option. If there is no match, Option.None will be returned.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <returns></returns>
        public static async Task<Option<T>> FirstOrNoneAsync<T>(this IQueryable<T> queryable)
        {
            var result = await queryable.FirstOrDefaultAsync();
            return result.SomeNotNull();
        }

        /// <summary>
        /// Returns the first match as an Option. If there is no match, Option.None will be returned.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <returns></returns>
        public static async Task<Option<T>> FirstOrNoneAsync<T>(this IQueryable<T> queryable, System.Linq.Expressions.Expression<Func<T, bool>> predicate)
        {
            var result = await queryable.FirstOrDefaultAsync(predicate);
            return result.SomeNotNull();
        }
    }
}