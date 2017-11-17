using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    public class AngularCacheBustedViews
    {
        public IList<string> Views { get; set; }
    }

    /// <summary>
    /// Extends the <see cref="IServiceCollection"/> to provide a <see cref="AngularCacheBustedViews"/> singleton,
    /// which contains the the relative paths to HTML files in the specified views folder with cache busted query params.
    /// For example, "/views/foo.html?v=5321
    /// </summary>
    public static class AngularCacheBustedViewsProvider
    {
        /// <summary>
        /// Adds a <see cref="AngularCacheBustedViews"/> singleton instance to the dependency injector.
        /// </summary>
        /// <param name="svc"></param>
        /// <param name="viewsFolderRelativePath">The folder containing the angular views relative to the /wwwroot folder.</param>
        /// <returns></returns>
        public static IServiceCollection AddCacheBustedAngularViews(this IServiceCollection svc, string viewsFolderRelativePath)
        {
            var relativeFileSystemSeparator = viewsFolderRelativePath.TrimStart('/');
            svc.AddSingleton(svcProvider => CreateCacheBustedViewsInstance(svcProvider, relativeFileSystemSeparator));

            return svc;
        }

        private static AngularCacheBustedViews CreateCacheBustedViewsInstance(IServiceProvider svcProvider, string viewsFolderRelativePath)
        {
            var host = svcProvider.GetRequiredService<IHostingEnvironment>();
            var viewsFolder = Path.Combine(host.WebRootPath, viewsFolderRelativePath);
            return new AngularCacheBustedViews
            {
                Views = Directory.EnumerateFiles(viewsFolder, "*.html", SearchOption.AllDirectories)
                    .Select(htmlFilePath => GetCacheBustedRelativeUrl(htmlFilePath, viewsFolderRelativePath))
                    .ToList()
            };
        }

        private static string GetCacheBustedRelativeUrl(string htmlFilePath, string viewsFolderRelativePath)
        {
            using (var file = File.OpenRead(htmlFilePath))
            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                var viewsFolder = '\\' + viewsFolderRelativePath + '\\';
                var viewFolderIndex = htmlFilePath.LastIndexOf(viewsFolder, StringComparison.InvariantCultureIgnoreCase);
                if (viewFolderIndex == -1)
                {
                    var error = new InvalidOperationException("Couldn't find views inside html file path");
                    error.Data.Add("views folder", viewsFolder);
                    error.Data.Add("html file path", htmlFilePath);
                    throw error;
                }

                // See if the view is in a subfolder.
                var htmlFileName = Path.GetFileName(htmlFilePath);
                var filePathRelativeToViewsFolder = htmlFilePath
                    .Substring(viewFolderIndex + viewsFolder.Length)
                    .Replace(htmlFileName, string.Empty, StringComparison.InvariantCultureIgnoreCase);

                var fileContentHash = string.Join(string.Empty, md5.ComputeHash(file));
                var fileNameWithHash = htmlFileName + "?v=" + fileContentHash;
                return Path.Combine($"/" + viewsFolderRelativePath, filePathRelativeToViewsFolder, fileNameWithHash)
                    .Replace("\\", "/")
                    .ToLowerInvariant();
            }
        }
    }
}
