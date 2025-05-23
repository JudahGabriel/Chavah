﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace BitShuva.Chavah.Common
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

        /// <summary>
        /// Looks for a string like "(feat. Joe Schmoe)" in the song name and returns the featured artists.
        /// </summary>
        /// <param name="songName"></param>
        /// <returns></returns>
        public static IEnumerable<string> GetFeaturedArtistsFromSongName(this string songName)
        {
            var featuredIndex = songName.IndexOf("(feat.", StringComparison.OrdinalIgnoreCase);
            if (featuredIndex == -1)
            {
                featuredIndex = songName.IndexOf("(ft.", StringComparison.OrdinalIgnoreCase);
            }
            if (featuredIndex == -1)
            {
                return Enumerable.Empty<string>();
            }

            var featuredEndIndex = songName.IndexOf(')', featuredIndex);
            if (featuredEndIndex == -1)
            {
                return Enumerable.Empty<string>();
            }

            return songName.Substring(featuredIndex, featuredEndIndex - featuredIndex)
                .Replace("(", string.Empty)
                .Replace(")", string.Empty)
                .Replace("feat.", string.Empty)
                .Replace("ft.", string.Empty)
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim());
        }

        /// <summary>
        /// Gets the file extension to use based on a mime type. Mime type should be image/jpeg, image/png, image/webp.
        /// </summary>
        /// <param name="mimeType"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentOutOfRangeException"></exception>
        public static string GetImageFileExtensionFromMimeType(this string mimeType)
        {
            return mimeType.ToLowerInvariant() switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                "image/jpg" => ".jpg",
                "image/jpeg" => ".jpg",
                _ => throw new ArgumentOutOfRangeException(nameof(mimeType), mimeType, "Unsupported image MIME type."),
            };
        }

        public static bool EqualsAny(
            this string text,
            StringComparison comparison,
            params string[] others)
        {
            return others.Any(s => string.Equals(text, s, comparison));
        }

        public static bool Contains(
            this string value,
            string substring,
            StringComparison comparison)
        {
            return value.IndexOf(substring, comparison) != -1;
        }

        /// <summary>
        /// Gets a deterministic hash code. Since string.GetHashCode is not deterministic, returning different results in different app contexts, this offers a deterministic alternative.
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        /// <remarks>
        /// Based on https://stackoverflow.com/a/5155015/536
        /// </remarks>
        public static int GetDeterministicHashCode(this string text)
        {
            return GetDeterministicHashCode(new[] { text });
        }

        /// <summary>
        /// Gets a deterministic hash code. Since string.GetHashCode is not deterministic, returning different results in different app contexts, this offers a deterministic alternative.
        /// </summary>
        /// <param name="lines"></param>
        /// <returns></returns>
        /// <remarks>
        /// Based on https://stackoverflow.com/a/5155015/536
        /// </remarks>
        public static int GetDeterministicHashCode(this IEnumerable<string> lines)
        {
            unchecked
            {
                var hash = 23;
                foreach (var line in lines)
                {
                    foreach (var c in line)
                    {
                        hash = (hash * 31) + c;
                    }
                }

                return hash;
            }
        }
    }
}
