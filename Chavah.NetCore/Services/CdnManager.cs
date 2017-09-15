using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using CoreFtp;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics.Contracts;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace BitShuva.Chavah.Common
{
    public class CdnManager
    {
        private readonly IOptions<CdnSettings> cdnSettings;
        private readonly ILogger logger;

        private const string musicDirectoryName = "music";
        private const string albumArtDirectoryName = "album-art";
        private const string artistImagesDirectoryName = "artist-images";

        public CdnManager(IOptions<CdnSettings> cdnSettings, ILogger logger)
        {
            this.cdnSettings = cdnSettings;
            this.logger = logger;
        }

        public Uri FtpAddress => new Uri(cdnSettings.Value.FtpHost);
        public Uri FtpWorkingDirectory => new Uri(cdnSettings.Value.FtpWorkingDirectory, UriKind.Relative);
        public Uri FtpMusic => this.FtpWorkingDirectory.Combine(cdnSettings.Value.MusicDirectory);
        //public Uri FtpAlbumArt => this.FtpAddress.Combine("album-art");
        //public Uri FtpArtistImages => this.FtpAddress.Combine("artist-images");
        public Uri CdnAddress => new Uri(cdnSettings.Value.HttpPath);
        public Uri CdnMusic => this.CdnAddress.Combine(cdnSettings.Value.MusicDirectory);
        //public Uri CdnAlbumArt => this.CdnAddress.Combine("album-art");
        //public Uri CdnArtistImages => this.CdnAddress.Combine("artist-images");
        
        /// <summary>
        /// Uploads the song to the CDN.
        /// </summary>
        /// <param name="song">The song whose MP3 to upload.</param>
        /// <param name="tempHttpAddress">The temporary HTTP address of the file. This is supplied by FilePickr. The file will be downloaded from here and moved to the CDN.</param>
        /// <returns>The HTTP URI to the MP3 file on the CDN.</returns>
        public async Task<Uri> UploadMp3ToCdn(Uri tempHttpAddress, string artist, string album, int songNumber, string songName)
        {
            var tempDownloadedFile = default(string);
            try
            {
                tempDownloadedFile = await DownloadFileLocally(tempHttpAddress);
                using (var ftpConnection = await CreateFtpConnection())
                {

                    // Inside the music directory, create the artist directory as needed.
                    await ftpConnection.ChangeWorkingDirectoryAsync(this.cdnSettings.Value.MusicDirectory);
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

                    return this.CdnMusic.Combine(artistDirectory, fileName);
                }
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
                    System.IO.File.Delete(tempDownloadedFile);
                }
            }
        }

        /// <summary>
        /// Uploads the song's album art to the CDN.
        /// </summary>
        /// <param name="song">The song whose album art to upload.</param>
        /// <param name="tempHttpAddress">The temporary HTTP address where the album art can be downloaded.</param>
        /// <param name="fileExtension">The desired file extension for the file on the CDN.</param>
        /// <returns>A task that represents the async operation.</returns>
        public async Task<Uri> UploadAlbumArtToCdn(Uri tempHttpAddress, string artist, string album, string fileExtension)
        {
            var tempDownloadedFile = default(string);
            try
            {
                tempDownloadedFile = await CdnManager.DownloadFileLocally(tempHttpAddress);
                return await UploadAlbumArtToCdn(GetAlphaNumericEnglish(artist), GetAlphaNumericEnglish(album), tempDownloadedFile, fileExtension);
            }
            finally
            {
                if (!string.IsNullOrEmpty(tempDownloadedFile))
                {
                    System.IO.File.Delete(tempDownloadedFile);
                }
            }
        }

        /// <summary>
        /// Uploads the song's local file representation to the CDN.
        /// </summary>
        /// <param name="song">The song to upload.</param>
        /// <param name="filePath">The fully qualified path to a local file.</param>
        /// <param name="fileExtension">The desired file extension for the file on the CDN.</param>
        /// <returns>The HTTP URI to the file on the CDN.</returns>
        private async Task<Uri> UploadAlbumArtToCdn(string artist, string album, string filePath, string fileExtension)
        {
            var fullFileName = string.Join(string.Empty, artist, " - ", album, fileExtension).ToLowerInvariant();
            return await UploadAlbumArtToCdn(fullFileName, filePath);
        }

        /// <summary>
        /// Uploads a local file to the album art directory on the CDN.
        /// </summary>
        /// <param name="localFileName">The file name, including extension, for the file. This will be the name of the file placed in the CDN.</param>
        /// <param name="filePath">The path to the contents of the file.</param>
        /// <returns></returns>
        private async Task<Uri> UploadAlbumArtToCdn(string localFileName, string filePath)
        {
            using (var ftpConnection = await CreateFtpConnection())
            {
                var localFileNameLower = localFileName.ToLowerInvariant();
                
                // Switch to the album art directory.
                await ftpConnection.ChangeWorkingDirectoryAsync(this.cdnSettings.Value.AlbumArtDirectory);
                using (var destinationStream = await ftpConnection.OpenFileWriteStreamAsync(localFileNameLower))
                using (var sourceStream = File.OpenRead(filePath))
                {
                    await sourceStream.CopyToAsync(destinationStream);
                }

                return albumArtUri.Combine(fileName);
            }
        }

        /// <summary>
        /// Uploads an image to the /[station]/artistimages folder on the CDN.
        /// </summary>
        /// <param name="tempHttpPath">The temporary HTTP path where the image currently resides. This file will be donwloaded and moved to the CDN.</param>
        /// <returns>The new HTTP URI to the image on the CDN.</returns>
        public static async Task<Uri> UploadArtistImage(Uri tempHttpPath, string fileName)
        {
            var ftpConnection = CreateFtpConnection();
            var ftpFileUri = ftpArtistImagesDirectory.Combine(fileName);
            using (var destinationStream = ftpConnection.OpenWrite(ftpFileUri))
            using (var webClient = new WebClient())
            using (var sourceStream = await new WebClient().OpenReadTaskAsync(tempHttpPath))
            {
                await sourceStream.CopyToAsync(destinationStream);
            }

            return artistImagesUri.Combine(fileName);
        }

        /// <summary>
        /// Downloads a file from HTTP to a local file on disk on the web server.
        /// </summary>
        /// <param name="httpUrl">The URL of the file to download.</param>
        /// <returns>A task containing the downloaded file name..</returns>
        public static async Task<string> DownloadFileLocally(Uri httpUrl)
        {
            // Pull it down from http. Ideally, our CDN would do this, but the CDN is currently
            // a dumb file server with a big pipe.

            var tempFileDirectory = HostingEnvironment.MapPath("~/App_Data");
            if (!Directory.Exists(tempFileDirectory))
            {
                Directory.CreateDirectory(tempFileDirectory);
            }

            var tempFilePath = Path.Combine(tempFileDirectory, Path.GetRandomFileName());
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
        public static void DeleteFromCdn(Song song)
        {
            var connection = CreateFtpConnection();
            var artistFolder = GetAlphaNumericEnglish(song.Artist);
            var songFileName = GetCdnSafeSongFileName(song.Artist, song.Album, song.Number, song.Name);
            var songUri = ftpMusicDirectory.Combine(artistFolder, songFileName);
            connection.DeleteFile(songUri);
        }

        public static Uri DefaultAlbumArtUri
        {
            get
            {
                return albumArtUri.Combine("default.jpg");
            }
        }

        private async Task<FtpClient> CreateFtpConnection()
        {
            var client = new FtpClient(new FtpClientConfiguration
            {
                Host = this.cdnSettings.Value.FtpHost,
                Username = this.cdnSettings.Value.FtpUserName,
                Password = this.cdnSettings.Value.FtpPassword,
                BaseDirectory = this.cdnSettings.Value.FtpWorkingDirectory
            });
            await client.LoginAsync();
            await client.ChangeWorkingDirectoryAsync(this.cdnSettings.Value.FtpWorkingDirectory);
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
