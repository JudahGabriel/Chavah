using Optional;
using Raven.Client;
using Raven.Client.Document;
using Raven.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Common
{
    public static class RavenExtensions
    {
        /// <summary>
        /// Asynchronously loads a document from Raven and stores it in an Option.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<Option<T>> LoadOptionAsync<T>(this IAsyncDocumentSession session, string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return default(T).SomeNotNull();
            }

            var result = await session.LoadAsync<T>(id);
            return result.SomeNotNull();
        }

        /// <summary>
        /// Asynchronously loads multiple documents from Raven and stores it in an Option.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="ids">The IDs of the documents to load.</param>
        /// <returns></returns>
        public static async Task<IEnumerable<Option<T>>> LoadOptionAsync<T>(this IAsyncDocumentSession session, IEnumerable<string> ids)
        {
            var result = await session.LoadAsync<T>(ids);
            return result.Select(v => v.SomeNotNull());
        }

        /// <summary>
        /// Asynchronously loads a multiple from Raven and returns the ones that aren't null.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="ids"></param>
        /// <returns></returns>
        public static async Task<IList<T>> LoadWithoutNulls<T>(this IAsyncDocumentSession session, IEnumerable<string> ids)
        {
            var result = await session.LoadAsync<T>(ids);
            return result
                .Where(item => item != null)
                .ToList();
        }

        /// <summary>
        /// Loads a document from the session and throws if it's null.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<T> LoadNotNullAsync<T>(this IAsyncDocumentSession session, string id)
        {
            var result = await session.LoadAsync<T>(id);
            if (result == null)
            {
                throw new ArgumentException($"Tried to load {id}, but it wasn't found in the database.");
            }

            return result;
        }

        /// <summary>
        /// Loads a document from the session and throws the specified exception if null.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<T> LoadNotNullAsync<T, TException>(this IAsyncDocumentSession session, string id, Func<TException> thrower)
            where TException : Exception
        {
            var result = await session.LoadAsync<T>(id);
            if (result == null)
            {
                throw thrower();
            }

            return result;
        }

        /// <summary>
        /// Loads a document from the session and throws if it's null.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<T> LoadNotNullAsync<T>(this IAsyncLoaderWithInclude<T> session, string id)
        {
            var result = await session.LoadAsync<T>(id);
            if (result == null)
            {
                throw new ArgumentException("Tried to load " + id + " but was null.");
            }

            return result;
        }

        /// <summary>
        /// Loads a document from the session and throws the specified exception if null.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<T> LoadNotNullAsync<T, TException>(this IAsyncLoaderWithInclude<T> session, string id, Func<TException> thrower)
            where TException : Exception
        {
            var result = await session.LoadAsync<T>(id);
            if (result == null)
            {
                throw thrower();
            }

            return result;
        }

        /// <summary>
        /// Asynchronously loads a document from Raven and stores it in an Option.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<Option<T>> LoadOptionAsync<T>(this IAsyncLoaderWithInclude<T> session, string id)
        {
            var result = await session.LoadAsync<T>(id);
            return result.SomeNotNull();
        }

        /// <summary>
        /// Asynchronously loads multiple documents from Raven and returns them as Options.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="ids"></param>
        /// <returns></returns>
        public static async Task<IEnumerable<Option<T>>> LoadOptionAsync<T>(this IAsyncLoaderWithInclude<T> session, IEnumerable<string> ids)
        {
            var result = await session.LoadAsync<T>(ids);
            return result.Select(v => v.SomeNotNull());
        }

        /// <summary>
        /// Loads a document from Raven and returns it as an Option.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static Option<T> LoadOption<T>(this IDocumentSession session, string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return default(T).None();
            }
            return session.Load<T>(id).SomeNotNull();
        }

        /// <summary>
        /// Sets the Raven document expiration for this object. The document will be deleted from the database after the specified date.
        /// Note: This specified object must be .Store()'d in the database before calling this method.
        /// </summary>
        public static void SetRavenExpiration<T>(this IAsyncDocumentSession dbSession, T obj, DateTime expiry)
        {
            dbSession.Advanced.GetMetadataFor(obj)["Raven-Expiration-Date"] = new RavenJValue(expiry);
        }

        /// <summary>
        /// Sets the Raven document expiration for this object. The document will be deleted from the database after the specified date.
        /// Note: This specified object must be .Store()'d in the database before calling this method.
        /// </summary>
        public static void SetRavenExpiration<T>(this IDocumentSession dbSession, T obj, DateTime expiry)
        {
            dbSession.Advanced.GetMetadataFor(obj)["Raven-Expiration-Date"] = new RavenJValue(expiry);
        }
    }
}