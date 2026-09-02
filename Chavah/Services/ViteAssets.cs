using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Resolves the entry tags emitted by the Vite client build. In Development the tags point at the
    /// Vite dev server (HMR); in Production they are parsed from the generated <c>wwwroot/vite-index.html</c>.
    /// </summary>
    public class ViteAssets
    {
        private const string DevOrigin = "http://127.0.0.1:5173";

        public bool IsDevelopment { get; }
        public string DevOrigin_ { get; } = DevOrigin;
        public string EntryJs { get; } = string.Empty;
        public string? EntryCss { get; }
        public IReadOnlyList<string> ModulePreloads { get; } = new List<string>();

        public ViteAssets(IWebHostEnvironment env)
        {
            IsDevelopment = env.IsDevelopment();
            if (IsDevelopment)
            {
                return; // Dev tags are emitted directly in _Layout.
            }

            var indexPath = Path.Combine(env.WebRootPath, "vite-index.html");
            if (!File.Exists(indexPath))
            {
                throw new FileNotFoundException($"vite-index.html not found at {indexPath}. Run the client build.");
            }

            var html = File.ReadAllText(indexPath);
            EntryJs = Regex.Match(html, "<script[^>]+src=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase).Groups[1].Value;
            var css = Regex.Match(html, "<link[^>]+rel=[\"']stylesheet[\"'][^>]+href=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase);
            EntryCss = css.Success ? css.Groups[1].Value : null;
            ModulePreloads = Regex.Matches(html, "<link[^>]+rel=[\"']modulepreload[\"'][^>]+href=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase)
                .Select(m => m.Groups[1].Value).ToList();
        }
    }
}
