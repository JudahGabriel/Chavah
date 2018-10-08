using BitShuva.Chavah.Models;
using System;
using System.IO;
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

        Task<Uri> UploadAlbumArtAsync(Uri tempHttpAddress, string artist, string album, string fileExtension);
        Task<Uri> UploadArtistImageAsync(Uri tempHttpPath, string fileName);
        Task<Uri> UploadMp3Async(Uri tempHttpAddress, string artist, string album, int songNumber, string songName);

        Task<Uri> UploadProfilePicAsync(Stream imageStream, string contentType);
        Task DeleteProfilePicAsync(string picture);

        Task DeleteAsync(Song song);
    }
}