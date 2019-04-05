using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Optional;
using Raven.Client.Documents;
using Raven.Client.Documents.Operations;
using Raven.Client.Documents.Session;
using Raven.Client.Documents.Session.Loaders;
using Raven.Client.Documents.Session.Operations.Lazy;
using Raven.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    public static class RavenExtensions
    {
        /// <summary>
        /// Add Chavah Raven Db instance with SSL Certificate loaded from Azure Vault.
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        /// <returns></returns>
        public static IServiceCollection AddChavahRavenDbDocStore(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddRavenDbDocStore(options: options =>
             {
                 var settings = new RavenSettings();
                 configuration.Bind(nameof(RavenSettings), settings);
                 options.Settings = settings;

                 // password is stored in azure vault.
                 var certString = configuration.GetValue<string>(settings.CertFilePath);
                 if (certString != null)
                 {
                     var certificate = Convert.FromBase64String(certString);
                     options.Certificate = new X509Certificate2(certificate);
                 }
             });

            return services;
        }

        /// <summary>
        /// Asynchronously loads a document from Raven and stores it in an Option.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static async Task<Option<T>> LoadOptionAsync<T>(
            this IAsyncDocumentSession session,
            string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return Option.None<T>();
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
        public static async Task<IEnumerable<Option<T>>> LoadOptionAsync<T>(
            this IAsyncDocumentSession session,
            IEnumerable<string> ids)
        {
            var result = await session.LoadAsync<T>(ids);
            return result.Values.Select(v => v.SomeNotNull());
        }

        /// <summary>
        /// Asynchronously loads a multiple from Raven and returns the ones that aren't null.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="ids"></param>
        /// <returns></returns>
        public static async Task<List<T>> LoadWithoutNulls<T>(
            this IAsyncDocumentSession session,
            IEnumerable<string> ids)
        {
            var result = await session.LoadAsync<T>(ids);
            return result.Values
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
        public static async Task<T> LoadRequiredAsync<T>(
            this IAsyncDocumentSession session,
            string id)
        {
            if (id == null)
            {
                throw new ArgumentNullException(nameof(id), "Tried to load required entity but passed in a null ID");
            }

            var result = await session.LoadAsync<T>(id);
            if (result == null)
            {
                throw new ArgumentException($"Tried to load a entity, but it wasn't found in the database.").WithData("id", id);
            }

            return result;
        }

        /// <summary>
        /// Lazily loads a document from the session. When the value is accessed, an exception will be thrown if the document is null.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="sessionOps"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static Lazy<Task<T>> LoadRequiredAsync<T>(
            this IAsyncLazySessionOperations sessionOps,
            string id)
        {
            if (id == null)
            {
                throw new ArgumentNullException(nameof(id), "Tried to load required entity but passed in a null ID");
            }

            var loadTask = sessionOps.LoadAsync<T>(id);
            var wrappedLazy = new Lazy<Task<T>>(() =>
            {
                // When unwrapping the Lazy, return a task that does the actually loading.
                var result = loadTask.Value;
                return result.ContinueWith(t =>
                {
                    // When unwrapping the Task, return the result of the task. But if it's null, throw an execption.
                    if (t.Result == null)
                    {
                        throw new ArgumentException($"Tried to lazily load {id}, but it wasn't found in the database.");
                    }

                    return t.Result;
                }, TaskContinuationOptions.OnlyOnRanToCompletion);
            }, isThreadSafe: false);

            return wrappedLazy;
        }

        /// <summary>
        /// Loads a document from the session and throws the specified exception if null.
        /// </summary>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <param name="thrower"></param>
        /// <returns></returns>
        public static async Task<T> LoadRequiredAsync<T, TException>(
            this IAsyncDocumentSession session,
            string id,
            Func<TException> thrower) where TException : Exception
        {
            if (id == null)
            {
                throw new ArgumentNullException(nameof(id), "Tried to load required entity but passed in a null ID");
            }

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
        /// <param name="ids"></param>
        /// <returns></returns>
        public static async Task<List<T>> LoadWithoutNulls<T>(
            this IAsyncLoaderWithInclude<T> session,
            IEnumerable<string> ids)
        {
            if (ids == null)
            {
                throw new ArgumentNullException(nameof(ids), "Tried to load required entity but passed in a null ID");
            }

            var results = await session.LoadAsync<T>(ids);
            return results.Values
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
        public static async Task<T> LoadRequiredAsync<T>(
            this IAsyncLoaderWithInclude<T> session,
            string id)
        {
            if (id == null)
            {
                throw new ArgumentNullException(nameof(id), "Tried to load required entity but passed in a null ID");
            }

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
        /// <typeparam name="TException"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <param name="thrower"></param>
        /// <returns></returns>
        public static async Task<T> LoadRequiredAsync<T, TException>(
            this IAsyncLoaderWithInclude<T> session,
            string id,
            Func<TException> thrower) where TException : Exception
        {
            if (id == null)
            {
                throw new ArgumentNullException(nameof(id), "Tried to load required entity but passed in a null ID");
            }

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
        public static async Task<Option<T>> LoadOptionAsync<T>(
            this IAsyncLoaderWithInclude<T> session,
            string id)
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
        public static async Task<IEnumerable<Option<T>>> LoadOptionAsync<T>(
            this IAsyncLoaderWithInclude<T> session,
            IEnumerable<string> ids)
        {
            var result = await session.LoadAsync<T>(ids);
            return result.Values.Select(v => v.SomeNotNull());
        }

        /// <summary>
        /// Loads a document from Raven and returns it as an Option.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="session"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static Option<T> LoadOption<T>(
            this IDocumentSession session,
            string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return default(T).None();
            }
            return session.Load<T>(id).SomeNotNull();
        }

        /// <summary>
        /// Lazily loads an entity from the Raven. The result is wrapped as an optional value.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="lazyOps"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public static Lazy<Task<Option<T>>> LoadOptionAsync<T>(
            this IAsyncLazySessionOperations lazyOps,
            string id)
        {
            var loadTask = lazyOps.LoadAsync<T>(id);
            var optionTask = new Lazy<Task<Option<T>>>(() =>
            {
                var result = loadTask.Value;
                return result.ContinueWith(t => t.Result.SomeNotNull(), TaskContinuationOptions.OnlyOnRanToCompletion);
            }, isThreadSafe: false);

            return optionTask;
        }

        /// <summary>
        /// Sets the Raven document expiration for this object. The document will be deleted from the database after the specified date.
        /// Note: This specified object must be .Store()'d in the database before calling this method.
        /// </summary>
        /// <param name="dbSession"></param>
        /// <param name="obj"></param>
        /// <param name="expiry"></param>
        public static void SetRavenExpiration<T>(
            this IAsyncDocumentSession dbSession,
            T obj,
            DateTime expiry)
        {
            dbSession.Advanced.GetMetadataFor(obj)["@expires"] = expiry.ToString("o", System.Globalization.CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Sets the Raven document expiration for this object. The document will be deleted from the database after the specified date.
        /// Note: This specified object must be .Store()'d in the database before calling this method.
        /// </summary>
        /// <param name="dbSession"></param>
        /// <param name="obj"></param>
        /// <param name="expiry"></param>
        public static void SetRavenExpiration<T>(
            this IDocumentSession dbSession,
            T obj,
            DateTime expiry)
        {
            dbSession.Advanced.GetMetadataFor(obj)["@expires"] = DateTime.UtcNow.ToString("o", System.Globalization.CultureInfo.InvariantCulture);
        }

        public static Operation PatchAll<T>(
            this IDocumentStore db,
            string jsPatchScript)
        {
            return PatchAll(db, db.Conventions.GetCollectionName(typeof(T)), jsPatchScript, default(Dictionary<string, object>).None());
        }

        public static Operation PatchAll<T>(
            this IDocumentStore db,
            string jsPatchScript,
            Option<Dictionary<string, object>> variables)
        {
            return PatchAll(db, db.Conventions.GetCollectionName(typeof(T)), jsPatchScript, variables);
        }

        public static Operation PatchAll(
            this IDocumentStore db,
            string collectionName,
            string jsPatchScript)
        {
            return PatchAll(db, collectionName, jsPatchScript, default(Dictionary<string, object>).None());
        }

        public static Operation PatchAll(
            this IDocumentStore db,
            string collectionName,
            string jsPatchScript,
            Option<Dictionary<string, object>> variables)
        {
            // Patch is in RQL. Example: "from AppUsers update { this.Foo = 123; }"
            var rqlPatch = new StringBuilder();
            rqlPatch.AppendLine($"from {collectionName}");
            rqlPatch.AppendLine("update {");

            // For each variable in the dictionary, declare the variable in the RQL script.
            variables
                .Map(i => i.AsEnumerable())
                .ValueOr(Enumerable.Empty<KeyValuePair<string, object>>())
                .Select(kv =>
                {
                    var variableValue = kv.Value?.ToString();
                    var escapedVariableValue = variableValue?.Replace("\"", "\\\""); // replace any quotes with escaped quotes. 'Hi I am a "JS" string' -> 'Hi I am a \"JS\" string'
                    var escapedWithQuotes = kv.Value is string ? "\"" + escapedVariableValue + "\"" : escapedVariableValue; // string? Surround the value with quotes. foo -> "foo"
                    return $"var {kv.Key} = {escapedWithQuotes};"; // The actual variable declaration, e.g. var foo = "123";
                })
                .ForEach(v => rqlPatch.AppendLine(v));

            rqlPatch.AppendLine(jsPatchScript);
            rqlPatch.Append('}');

            var patch = new PatchByQueryOperation(new Raven.Client.Documents.Queries.IndexQuery
            {
                Query = rqlPatch.ToString()
            });
            return db.Operations.Send(patch);
        }
    }
}