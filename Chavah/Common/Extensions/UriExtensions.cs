using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    public static class UriExtensions
    {
        public static readonly Uri Localhost = new Uri("http://localhost");

        /// <summary>
        /// Combines a URI with multiple paths or file names.
        /// </summary>
        /// <param name="uri">The URI.</param>
        /// <param name="paths">The paths to combine onto the URI.</param>
        /// <returns>A new URI containing the root and paths appended to it.</returns>
        public static Uri Combine(this Uri uri, params string[] paths)
        {
            // We really need a Path.Combine for URIs. http://stackoverflow.com/questions/372865/path-combine-for-urls
            var rootUriString = uri.ToString().TrimEnd('/');
            var builder = new StringBuilder(rootUriString.Length + paths.Sum(p => p.Length));
            builder.Append(uri.ToString().TrimEnd('/'));
            foreach (var path in paths)
            {
                builder.Append('/');
                builder.Append(path.Trim('/'));
            }

            return new Uri(builder.ToString());
        }
    }
}
