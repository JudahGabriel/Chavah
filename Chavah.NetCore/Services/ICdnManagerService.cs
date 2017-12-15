using BitShuva.Chavah.Models;
using System;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Services
{
    public interface ICdnManagerService
    {
        //Uri FtpAddress { get; }
        //Uri FtpMusic { get; }
        //Uri FtpWorkingDirectory { get; }
        Uri HttpAlbumArt { get; }
        Uri HttpArtistImages { get; }
        Uri HttpHost { get; }
        Uri HttpMusic { get; }

        Task<Uri> UploadAlbumArtToCdn(Uri tempHttpAddress, string artist, string album, string fileExtension);
        Task<Uri> UploadArtistImage(Uri tempHttpPath, string fileName);
        Task<Uri> UploadMp3ToCdn(Uri tempHttpAddress, string artist, string album, int songNumber, string songName);

        Task DeleteFromCdnAsync(Song song);
    }
}