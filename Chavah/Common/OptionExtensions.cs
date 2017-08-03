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
    }
}