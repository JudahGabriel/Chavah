using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.App_Start
{
    /// <summary>
    /// MVC bundle transformer that searches a file for paths to our Angular views, e.g. "/App/Views/Blah.html"
    /// and replaces them with cache busting versions = "/AppViews/Blah.html?cacheBust=1234"
    /// The ?cacheBust value is the hash code of the contents of that HTML file.
    /// 
    /// The end result is that Angular views get cached, but when their contents change the browser will fetch the changed version.
    /// </summary>
    public class AngularViewCacheBuster : System.Web.Optimization.IItemTransform
    {
        public string Process(string includedVirtualPath, string input)
        {
            return CacheBustHtmlReferences(input);
        }

        string CacheBustHtmlReferences(string fileContents)
        {
            var lines = fileContents
                .Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries)
                .Select(l => GetCacheBustedHtmlReferenceLine(l));
            return string.Join("\r\n", lines);
        }

        string GetCacheBustedHtmlReferenceLine(string line)
        {
            var htmlReferenceStartIndex = line.IndexOf("/App/Views/", StringComparison.InvariantCultureIgnoreCase);
            if (htmlReferenceStartIndex >= 0)
            {
                var htmlReferenceEndIndex = line.IndexOfAny(new[] { '"', '\'' }, htmlReferenceStartIndex);
                if (htmlReferenceEndIndex > htmlReferenceStartIndex)
                {
                    var htmlReference = line.Substring(htmlReferenceStartIndex, htmlReferenceEndIndex - htmlReferenceStartIndex);
                    var htmlFileName = System.IO.Path.GetFileName(htmlReference);
                    var cacheBustIndex = htmlFileName.IndexOf("?cachebust", StringComparison.InvariantCultureIgnoreCase);
                    var htmlFileNameWithoutCacheBust = cacheBustIndex == -1 ? htmlFileName : htmlFileName.Substring(0, cacheBustIndex);
                    var htmlHashCode = GetHashCodeForHtmlContents(htmlReference);
                    return line.Replace(htmlFileName, string.Format("{0}?cachebust={1}", htmlFileNameWithoutCacheBust, htmlHashCode));
                }
            }

            return line;
        }

        int GetHashCodeForHtmlContents(string filePath)
        {
            var directoryPath = VirtualPathUtility.ToAbsolute(filePath);
            var root = AppDomain.CurrentDomain.BaseDirectory;
            var absolutePath = System.IO.Path.Combine(root, directoryPath.Replace("/App/", "App/").Replace("/", "\\"));
            return System.IO.File.ReadAllText(absolutePath).GetHashCode();
        }
    }
}