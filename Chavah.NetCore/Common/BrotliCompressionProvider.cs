using Microsoft.AspNetCore.ResponseCompression;
using System.IO;
using System.IO.Compression;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// Hooks into the Microsoft.AspNetCore.ResponseCompression NuGet package to provide Brotli compression.
    /// </summary>
    /// <remarks>
    /// Based on https://www.meziantou.net/2017/07/17/use-brotli-compression-with-asp-net-core
    /// </remarks>
    public class BrotliCompressionProvider : ICompressionProvider
    {
        public string EncodingName => "br";
        public bool SupportsFlush => true;

        public Stream CreateStream(Stream outputStream)
        {
            return new BrotliStream(outputStream, CompressionMode.Compress, leaveOpen: false);
        }
    }
}
