using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Common
{
    public static class StringExtensions
    {
        /// <summary>
        /// Converts the string enum name into an enum constant. If it can't be converted, null will be returned.
        /// </summary>
        /// <typeparam name="TEnum"></typeparam>
        /// <param name="input"></param>
        /// <returns></returns>
        public static TEnum? ToEnum<TEnum>(this string input) where TEnum : struct
        {
            if (Enum.TryParse<TEnum>(input, true, out var result))
            {
                return result;
            }

            return new TEnum?();
        }

        /// <summary>
        /// Changes the string to lower case with an upper case first letter.
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        public static string Capitalize(this string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return input;
            }

            var firstLetterCapital = char.ToUpperInvariant(input[0]);
            var followingLettersLower = input.Skip(1).Select(c => char.ToLowerInvariant(c));
            return new string(new[] { firstLetterCapital }.Concat(followingLettersLower).ToArray());
        }

        /// <summary>
        /// Checks whether any of the strings contain the specified value.
        /// </summary>
        /// <param name="input"></param>
        /// <param name="value"></param>
        /// <param name="comparison"></param>
        /// <returns></returns>
        public static bool Contains(this IEnumerable<string> input, string value, StringComparison comparison)
        {
            return input.Any(i => string.Equals(i, value, comparison));
        }

        /// <summary>
        /// Checks whether any of the strings contains any of the specified values.
        /// </summary>
        /// <param name="inputs"></param>
        /// <param name="values"></param>
        /// <param name="comparison"></param>
        /// <returns></returns>
        public static bool ContainsAny(this IEnumerable<string> inputs, IEnumerable<string> values, StringComparison comparison)
        {
            return inputs.Any(i => values.Contains(i, comparison));
        }

        /// <summary>
        /// Finds the index of the character matching the specified predicate.
        /// </summary>
        /// <param name="input"></param>
        /// <param name="predicate"></param>
        /// <returns></returns>
        public static int IndexWhere(this string input, Func<char, bool> predicate)
        {
            for (var i = 0; i < input.Length; i++)
            {
                if (predicate(input[i]))
                {
                    return i;
                }
            }

            return -1;
        }

        /// <summary>
        /// Takes a string that starts with English but may end in Hebrew.
        /// Input: "Adonai Li אדוני לי"
        /// Output: (english: Adonai Li, hebrew: אדוני לי)
        /// </summary>
        /// <param name="input">The input, which may contain English and Hebrew letters.</param>
        /// <returns></returns>
        public static (string english, string hebrew) GetEnglishAndHebrew(this string input)
        {
            const int aleph = 1488;
            const int tav = 1514;
            var isHebrewLetter = new Func<char, bool>(c => c >= aleph && c <= tav);
            var firstHebrewLetterIndex = input.IndexWhere(isHebrewLetter);
            if (firstHebrewLetterIndex == -1)
            {
                return (english: input, hebrew: string.Empty);
            }

            var english = input.Substring(0, firstHebrewLetterIndex).Trim();
            var hebrew = input.Substring(firstHebrewLetterIndex).Trim();
            return (english, hebrew);
        }

        public static bool EqualsAny(this string text, StringComparison comparison, params string[] others)
        {
            return others.Any(s => string.Equals(text, s, comparison));
        }

        public static bool Contains(this string value, string substring, StringComparison comparison)
        {
            return value.IndexOf(substring, comparison) != -1;
        }
    }
}