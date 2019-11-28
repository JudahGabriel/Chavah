using System;
using System.Collections;
using System.Linq;
using System.Reflection;
using System.Text;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// Exception extension utilities.
    /// </summary>
    /// <remarks>
    /// Based on https://stackoverflow.com/a/34001508/536
    /// </remarks>
    public static class ExceptionExtensions
    {
        /// <summary>
        /// Adds key/value info to the exception's <see cref="Exception.Data"/> dictionary.
        /// </summary>
        /// <param name="error"></param>
        /// <param name="key"></param>
        /// <param name="value"></param>
        /// <returns></returns>
        public static Exception WithData(this Exception error, string key, object value)
        {
            error.Data.Add(key, value);
            return error;
        }
    }
}
