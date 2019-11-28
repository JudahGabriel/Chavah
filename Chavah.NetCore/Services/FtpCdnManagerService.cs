using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;

using CoreFtp;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// CDN manager that uploads media to our CDN via FTP. 
    /// </summary>
    /// <remarks>As of 5/15/19, this is no longer in use. We now use BunnyCdnManager instead.</remarks>
    public class FtpCdnManagerService : ICdnManagerService
    {
        private readonly CdnSettings options;
        private readonly ILogger logger;
        private readonly IWebHostEnvironment hosting;

        public FtpCdnManagerService(
            IOptionsMonitor<CdnSettings> options,
            ILogger<FtpCdnManagerService> logger,
            IWebHostEnvironment hostingEnv)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            hosting = hostingEnv ?? throw new ArgumentNullException(nameof(hostingEnv));
            this.options = options.CurrentValue;
        }

        private Uri HttpHost => new Uri(options.HttpPath);
        private Uri HttpMusic => HttpHost.Combine(options.MusicDirectory);
        private Uri HttpAlbumArt => HttpHost.Combine(options.AlbumArtDirectory);
        private Uri HttpProfilePics => HttpHost.Combine(options.ProfilePicsDirectory);

        /// <summary>
        /// Uploads the song to the CDN.
        /// </summary>
        /// <param name="source">The temporary HTTP address of the file. This is supplied by FilePickr. The file will be downloaded from here and moved to the CDN.</param>
        /// <param name="artist"></param>
        /// <param name="album"></param>
        /// <param name="songNumber"></param>
        /// <param name="songName"></param>
        /// <returns>The HTTP URI to the MP3 file on the CDN.</returns>
        public async Task<Uri> UploadMp3Async(Uri source, string artist, string album, int songNumber, string songName)
        {
            var tempDownloadedFile = default(string);
            try
            {
                tempDownloadedFile = await DownloadFileLocally(source);
                using var ftpConnection = await CreateFtpConnection();

                // Inside the music directory, create the artist directory as needed.
                await ftpConnection.ChangeWorkingDirectoryAsync(options?.MusicDirectory);
                var musicArtistDirs = await ftpConnection.ListDirectoriesAsync();
                var artistDirectory = GetAlphaNumericEnglish(artist);
                var hasArtistDirectory = musicArtistDirs.Any(m => m.Name == artistDirectory);
                if (!hasArtistDirectory)
                {
                    await ftpConnection.CreateDirectoryAsync(artistDirectory);
                }

                // Move into the artist directory and store the file.
                var fileName = GetCdnSafeSongFileName(artist, album, songNumber, songName);
                await ftpConnection.ChangeWorkingDirectoryAsync(artistDirectory);

                using (var destinationStream = await ftpConnection.OpenFileWriteStreamAsync(fileName))
                using (var sourceStream = File.OpenRead(tempDownloadedFile))
                {
                    await sourceStream.CopyToAsync(destinationStream);
                }

                return HttpMusic.Combine(artistDirectory, fileName);
            }
            catch (Exception error)
            {
                var errorMessage = "Unable to upload MP3 to CDN. {songInfo}";
                logger.LogError(errorMessage, error, (artist, album, songName));
                throw;
            }
            finally
            {
                if (!string.IsNullOrEmpty(tempDownloadedFile))
                {
                    File.Delete(tempDownloadedFile);
                }
            }
        }

        /// <summary>
        /// Uploads the song's album art to the CDN.
        /// </summary>
        /// <param name="source">The temporary HTTP address where the album art can be downloaded.</param>
        /// <param name="album">The name of the album.</param>
        /// <param name="artist">The name of the album's artist.</param>
        /// <param name="fileExtension">The desired file extension for the file on the CDN.</param>
        /// <returns>A task that represents the async operation.</returns>
        public async Task<Uri> UploadAlbumArtAsync(Uri source, string artist, string album, string fileExtension)
        {
            var tempDownloadedFile = default(string);
            try
            {
                tempDownloadedFile = await DownloadFileLocally(source);
                return await UploadAlbumArt(GetAlphaNumericEnglish(artist), GetAlphaNumericEnglish(album), tempDownloadedFile, fileExtension);
            }
            finally
            {
                if (!string.IsNullOrEmpty(tempDownloadedFile))
                {
                    File.Delete(tempDownloadedFile);
                }
            }
        }

        /// <summary>
        /// Uploads an image to the /[station]/artistimages folder on the CDN.
        /// </summary>
        /// <param name="tempHttpPath">The temporary HTTP path where the image currently resides. This file will be donwloaded and moved to the CDN.</param>
        /// <param name="fileName"></param>
        /// <returns>The new HTTP URI to the image on the CDN.</returns>
        public async Task<Uri> UploadArtistImageAsync(Uri tempHttpPath, string fileName)
        {
            using var ftpConnection = await CreateFtpConnection();
            // Switch to the artist images directory.
            await ftpConnection.ChangeWorkingDirectoryAsync(options?.ArtistImagesDirectory);
            var safeFileName = GetAlphaNumericEnglish(Path.GetFileNameWithoutExtension(fileName));

            // Copy the temporary HTTP path to the FTP destination.
            using (var destinationStream = await ftpConnection.OpenFileWriteStreamAsync(safeFileName))
            using (var webClient = new WebClient())
            using (var sourceStream = await webClient.OpenReadTaskAsync(tempHttpPath))
            {
                await sourceStream.CopyToAsync(destinationStream);
            }

            return HttpAlbumArt.Combine(fileName);
        }

        /// <summary>
        /// Uploads a profile picture.
        /// </summary>
        /// <param name="imageStream"></param>
        /// <param name="contentType"></param>
        /// <returns></returns>
        public async Task<Uri> UploadProfilePicAsync(Stream imageStream, string contentType)
        {
            using var ftpConnection = await CreateFtpConnection();
            var fileExtension = string.Equals("image/png", contentType, StringComparison.InvariantCultureIgnoreCase) ? ".png" : ".jpg";
            var fileName = Guid.NewGuid().GetHashCode().ToString() + fileExtension;

            // Switch to the album art directory.
            await ftpConnection.ChangeWorkingDirectoryAsync(options.ProfilePicsDirectory);
            using (var destinationStream = await ftpConnection.OpenFileWriteStreamAsync(fileName))
            {
                await imageStream.CopyToAsync(destinationStream);
            }

            return HttpProfilePics.Combine(fileName);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="directory"></param>
        /// <returns></returns>
        public Task<List<string>> GetFiles(string directory)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="directory"></param>
        /// <returns></returns>
        public Task<List<string>> GetDirectories(string directory)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Uploads the song's local file representation to the CDN.
        /// </summary>
        /// <param name="artist"></param>
        /// <param name="album"></param>
        /// <param name="filePath">The fully qualified path to a local file.</param>
        /// <param name="fileExtension">The desired file extension for the file on the CDN.</param>
        /// <returns>The HTTP URI to the file on the CDN.</returns>
        private async Task<Uri> UploadAlbumArt(string artist, string album, string filePath, string fileExtension)
        {
            var fullFileName = string.Concat(artist, " - ", album, fileExtension).ToLowerInvariant();
            return await UploadAlbumArt(fullFileName, filePath);
        }

        /// <summary>
        /// Uploads a local file to the album art directory on the CDN.
        /// </summary>
        /// <param name="destinationFileName">The file name, including extension, for the file. This will be the name of the file placed in the CDN.</param>
        /// <param name="sourceFilePath">The path to the contents of the file.</param>
        /// <returns></returns>
        private async Task<Uri> UploadAlbumArt(string destinationFileName, string sourceFilePath)
        {
            using var ftpConnection = await CreateFtpConnection();
            var fileNameLower = destinationFileName.ToLowerInvariant();

            // Switch to the album art directory.
            await ftpConnection.ChangeWorkingDirectoryAsync(options?.AlbumArtDirectory);
            using (var destinationStream = await ftpConnection.OpenFileWriteStreamAsync(fileNameLower))
            using (var sourceStream = File.OpenRead(sourceFilePath))
            {
                await sourceStream.CopyToAsync(destinationStream);
            }

            return HttpAlbumArt.Combine(fileNameLower);
        }

        /// <summary>
        /// Downloads a file from HTTP to a local file on disk on the web server.
        /// </summary>
        /// <param name="httpUrl">The URL of the file to download.</param>
        /// <returns>A task containing the downloaded file name..</returns>
        private async Task<string> DownloadFileLocally(Uri httpUrl)
        {
            var appData = Path.Combine(hosting.ContentRootPath, "App_Data");
            if (!Directory.Exists(appData))
            {
                Directory.CreateDirectory(appData);
            }

            var tempFilePath = Path.Combine(appData, Path.GetRandomFileName());
            using (var downloader = new System.Net.WebClient())
            {
                await downloader.DownloadFileTaskAsync(httpUrl, tempFilePath);
            }

            return tempFilePath;
        }

        /// <summary>
        /// Deletes the song's MP3 file on the CDN.
        /// </summary>
        /// <param name="song"></param>
        public async Task DeleteSongAsync(Song song)
        {
            using var connection = await CreateFtpConnection();
            var artistFolder = GetAlphaNumericEnglish(song.Artist);
            var songFileName = GetCdnSafeSongFileName(song.Artist, song.Album, song.Number, song.Name);

            // Go into the /music/[artist name] folder.
            await connection.ChangeWorkingDirectoryAsync(options.MusicDirectory);
            await connection.ChangeWorkingDirectoryAsync(artistFolder);

            await connection.DeleteFileAsync(songFileName);
        }

        /// <summary>
        /// Deletes a profile picture.
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        public async Task DeleteProfilePicAsync(AppUser user)
        {
            if (user.ProfilePicUrl != null)
            {
                using var connection = await CreateFtpConnection();
                await connection.ChangeWorkingDirectoryAsync(options.ProfilePicsDirectory).ConfigureAwait(false);
                var fileName = user.ProfilePicUrl.OriginalString.Split('/').Last();
                await connection.DeleteFileAsync(fileName).ConfigureAwait(false);
            }
        }

        private async Task<FtpClient> CreateFtpConnection()
        {
            var client = new FtpClient(new FtpClientConfiguration
            {
                Host = options?.FtpHost,
                Username = options?.FtpUserName,
                Password = options?.FtpPassword,
            });
            await client.LoginAsync();
            await client.ChangeWorkingDirectoryAsync(options?.FtpWorkingDirectory);
            return client;
        }

        private static string GetCdnSafeSongFileName(string artist, string album, int songNumber, string songName)
        {
            if (string.IsNullOrWhiteSpace(artist))
            {
                artist = "Unspecified Artist";
            }
            if (string.IsNullOrWhiteSpace(album))
            {
                album = "Unspecified Album";
            }
            if (string.IsNullOrWhiteSpace(songName))
            {
                songName = "Unspecified Song Name";
            }

            var songNumberPaddedByZero = songNumber > 0 && songNumber < 10 ? "0" + songNumber : songNumber.ToString();

            return $"{GetAlphaNumericEnglish(artist)} - {GetAlphaNumericEnglish(album)} - {songNumberPaddedByZero} - {GetAlphaNumericEnglish(songName)}.mp3";
        }

        public static string GetAlphaNumericEnglish(string input)
        {
            var safe = input
                .Replace(':', '_')
                .Replace('/', '+')
                .Replace('é', 'e')
                .Replace('ú', 'u')
                .Replace("?", "")
                .Replace('ó', 'o')
                .Replace('í', 'i')
                .Replace('á', 'a');
            var permittedSpecialChars = new[] { ',', '.', '(', ')', ' ', '_', '+' };
            var isAscii = new Func<char, bool>(c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || char.IsNumber(c));
            if (safe.ToLowerInvariant().All(c => isAscii(c) || permittedSpecialChars.Contains(c)))
            {
                return safe;
            }
            else
            {
                return new string(safe
                    .Select(c => isAscii(c) || char.IsNumber(c) || permittedSpecialChars.Contains(c) ? c : '_')
                    .ToArray());
            }
        }
    }
}
