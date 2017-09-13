using Optional;
using Optional.Async;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Common
{
    public static class OptionExtensions
    {
        /// <summary>
        /// Gets the value of the option, or default(T) if the option doesn't have a value.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="option"></param>
        /// <returns></returns>
        public static T ValueOrDefault<T>(this Option<T> option)
        {
            return option.ValueOr(default(T));
        }

        /// <summary>
        /// Evaluates a specified function, based on whether a value is present or not.
        /// </summary>
        /// <param name="some">The function to evaluate if the value is present.</param>
        /// <returns>The result of the evaluated function.</returns>
        public static Task MatchSome<T>(this AsyncOption<T> option, Action<T> some)
        {
            return option.Match(some, () => { });
        }

        /// <summary>
        /// Converts a Nullable&lt;T&gt; to an Option&lt;T&gt; instance.
        /// </summary>
        /// <param name="value">The Nullable&lt;T&gt; instance.</param>
        /// <returns>The Option&lt;T&gt; instance.</returns>
        public static Option<T> ToOption<T>(this T? value) where T : struct =>
            value.HasValue ? Option.Some(value.Value) : Option.None<T>();

        /// <summary>
        /// Combines .Map with .NotNull. Maps the value of the option using the mapper. If the result of the map is null, none will be returned.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <typeparam name="TMap"></typeparam>
        /// <param name="option"></param>
        /// <param name="mapper"></param>
        /// <returns></returns>
        public static Option<TMap> FlatMap<T, TMap>(this Option<T> option, Func<T, TMap> mapper)
        {
            return option
                .Map(mapper)
                .NotNull();
        }
    }
}