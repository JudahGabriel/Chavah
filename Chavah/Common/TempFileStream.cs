using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// A temporary file with an open stream. When disposed, the stream is closed and the file is deleted.
    /// </summary>
    public class TempFileStream : IDisposable
    {
        public TempFileStream(string filePath, Stream stream)
        {
            FilePath = filePath;
            Stream = stream;
        }

        public string FilePath { get; }
        public Stream Stream { get; }

        public static TempFileStream Open(string filePath)
        {
            var stream = File.OpenRead(filePath);
            return new TempFileStream(filePath, stream);
        }

        public void Dispose()
        {
            Stream.Dispose();
            File.Delete(FilePath);
        }
    }
}
