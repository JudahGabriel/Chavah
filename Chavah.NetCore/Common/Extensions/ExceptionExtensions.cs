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
        public static string ToDetailedString(this Exception exception)
        {
            if (exception == null)
            {
                throw new ArgumentNullException(nameof(exception));
            }

            return ToDetailedString(exception, ExceptionOptions.Default);
        }

        public static string ToDetailedString(this Exception exception, ExceptionOptions options)
        {
            var stringBuilder = new StringBuilder();

            AppendValue(stringBuilder, "Type", exception.GetType().FullName, options);

            foreach (var property in exception
                .GetType()
                .GetProperties(BindingFlags.Instance | BindingFlags.Public)
                .Where(p => p.CanRead)
                .OrderByDescending(x => string.Equals(x.Name, nameof(exception.Message), StringComparison.Ordinal))
                .ThenByDescending(x => string.Equals(x.Name, nameof(exception.Source), StringComparison.Ordinal))
                .ThenBy(x => string.Equals(x.Name, nameof(exception.InnerException), StringComparison.Ordinal))
                .ThenBy(x => string.Equals(x.Name, nameof(AggregateException.InnerExceptions), StringComparison.Ordinal)))
            {
                var value = property.GetValue(exception, null);
                if (value == null && options.OmitNullProperties)
                {
                    if (options.OmitNullProperties)
                    {
                        continue;
                    }
                    else
                    {
                        value = string.Empty;
                    }
                }

                AppendValue(stringBuilder, property.Name, value, options);
            }

            return stringBuilder.ToString().TrimEnd('\r', '\n');
        }

        private static void AppendCollection(StringBuilder stringBuilder, string propertyName, IEnumerable collection, ExceptionOptions options)
        {
            stringBuilder.Append(options.Indent).Append(propertyName).AppendLine(" =");

            var innerOptions = new ExceptionOptions(options, options.CurrentIndentLevel + 1);

            var i = 0;
            foreach (var item in collection)
            {
                var innerPropertyName = $"[{i}]";

                if (item is Exception innerException)
                {
                    AppendException(
                        stringBuilder,
                        innerPropertyName,
                        innerException,
                        innerOptions);
                }
                else
                {
                    AppendValue(
                        stringBuilder,
                        innerPropertyName,
                        item,
                        innerOptions);
                }

                ++i;
            }
        }

        private static void AppendException(StringBuilder stringBuilder, string propertyName, Exception exception, ExceptionOptions options)
        {
            var innerExceptionString = ToDetailedString(
                exception,
                new ExceptionOptions(options, options.CurrentIndentLevel + 1));

            stringBuilder.Append(options.Indent).Append(propertyName).AppendLine(" =");
            stringBuilder.AppendLine(innerExceptionString);
        }

        private static string IndentString(string value, ExceptionOptions options)
        {
            return value.Replace(Environment.NewLine, Environment.NewLine + options.Indent);
        }

        private static void AppendValue(StringBuilder stringBuilder, string propertyName, object value, ExceptionOptions options)
        {
            if (value is DictionaryEntry dictionaryEntry)
            {
                stringBuilder.Append(options.Indent)
                    .Append(propertyName)
                    .Append(" = ")
                    .Append(dictionaryEntry.Key)
                    .Append(" : ")
                    .Append(dictionaryEntry.Value)
                    .AppendLine();
            }
            else if (value is Exception innerException)
            {
                AppendException(
                    stringBuilder,
                    propertyName,
                    innerException,
                    options);
            }
            else if (value is IEnumerable collection && !(value is string))
            {
                if (collection.GetEnumerator().MoveNext())
                {
                    AppendCollection(
                        stringBuilder,
                        propertyName,
                        collection,
                        options);
                }
            }
            else
            {
                stringBuilder.Append(options.Indent).Append(propertyName).Append(" = ").Append(value).AppendLine();
            }
        }

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

    public struct ExceptionOptions
    {
        public static readonly ExceptionOptions Default = new ExceptionOptions()
        {
            CurrentIndentLevel = 0,
            IndentSpaces = 4,
            OmitNullProperties = false
        };

        internal ExceptionOptions(ExceptionOptions options, int currentIndent)
        {
            CurrentIndentLevel = currentIndent;
            IndentSpaces = options.IndentSpaces;
            OmitNullProperties = options.OmitNullProperties;
        }

        internal string Indent => new string(' ', IndentSpaces * CurrentIndentLevel);

        internal int CurrentIndentLevel { get; set; }

        public int IndentSpaces { get; set; }

        public bool OmitNullProperties { get; set; }
    }
}
