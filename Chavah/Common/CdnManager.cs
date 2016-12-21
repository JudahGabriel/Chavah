using BitShuva.Common;
using BitShuva.Models;
using FlagFtp;
////using NLog;
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
using System.Web.Hosting;
using System.Web.Http;

namespace BitShuva.Common
{
    public static class CdnManager
    {
        public static readonly Uri ftpAddress = new Uri(ConfigurationManager.AppSettings["CdnFtpAddress"]);
        public static readonly Uri ftpMusicDirectory = ftpAddress.Combine("music");
        public static readonly Uri ftpAlbumArtDirectory = ftpAddress.Combine("album-art");
        public static readonly Uri ftpArtistImagesDirectory = ftpAddress.Combine("artist-images");
        public static readonly Uri cdnAddress = new Uri(ConfigurationManager.AppSettings["CdnPath"]);
        public static readonly Uri musicUri = cdnAddress.Combine("music");
        public static readonly Uri albumArtUri = cdnAddress.Combine("album-art");
        public static readonly Uri artistImagesUri = cdnAddress.Combine("artist-images");
        
        /// <summary>
        /// Uploads the song to the CDN.
        /// </summary>
        /// <param name="song">The song whose MP3 to upload.</param>
        /// <param name="tempHttpAddress">The temporary HTTP address of the file. This is supplied by FilePickr. The file will be downloaded from here and moved to the CDN.</param>
        /// <returns>The HTTP URI to the MP3 file on the CDN.</returns>
        public static async Task<Uri> UploadMp3ToCdn(Uri tempHttpAddress, string artist, string album, int songNumber, string songName)
        {
            var tempDownloadedFile = default(string);
            var fileName = GetCdnSafeSongFileName(artist, album, songNumber, songName);
            var fileMp3Uri = ftpMusicDirectory.Combine(artist, fileName);
            try
            {
                tempDownloadedFile = await DownloadFileLocally(tempHttpAddress);
                var ftpConnection = CreateFtpConnection();

                // Create the artist directory as needed.
                var artistDirectory = ftpMusicDirectory.Combine(artist);
                var artistDirExists = ftpConnection.DirectoryExists(artistDirectory);
                if (!artistDirExists)
                {
                    try
                    {
                        ftpConnection.CreateDirectory(artistDirectory);
                    }
                    catch (Exception)
                    {
                        // Some FTPs don't report DirectoryExists correctly, then fail on CreateDirectory of existing.
                    }
                }
                
                using (var destinationStream = ftpConnection.OpenWrite(fileMp3Uri))
                using (var sourceStream = File.OpenRead(tempDownloadedFile))
                {
                    await sourceStream.CopyToAsync(destinationStream);
                }                

                return musicUri.Combine(artist, fileName);
            }
            catch (Exception error)
            {
                var errorMessage = $"Unable to upload MP3 to CDN. Attempted to upload \"{fileName}\" to {fileMp3Uri}. See inner exception for details.";
                throw new Exception(errorMessage, error);
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
        public static async Task<Uri> UploadAlbumArtToCdn(Uri tempHttpAddress, string artist, string album, string fileExtension)
        {
            var tempDownloadedFile = default(string);
            try
            {
                tempDownloadedFile = await CdnManager.DownloadFileLocally(tempHttpAddress);
                return await UploadAlbumArtToCdn(artist, album, tempDownloadedFile, fileExtension);
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
        private static async Task<Uri> UploadAlbumArtToCdn(string artist, string album, string filePath, string fileExtension)
        {
            var fullFileName = string.Join(string.Empty, artist, " - ", album, fileExtension).ToLowerInvariant();
            return await UploadAlbumArtToCdn(fullFileName, filePath);
        }

        /// <summary>
        /// Uploads a local file to the album art directory on the CDN.
        /// </summary>
        /// <param name="fullFileName">The file name, including extension, for the file. This will be the name of the file placed in the CDN.</param>
        /// <param name="filePath">The path to the contents of the file.</param>
        /// <returns></returns>
        private static async Task<Uri> UploadAlbumArtToCdn(string fullFileName, string filePath)
        {
            var ftpConnection = CreateFtpConnection();
            var fileName = fullFileName.ToLowerInvariant();
            var ftpFileUri = ftpAlbumArtDirectory.Combine(fileName);
            try
            {
                using (var destinationStream = ftpConnection.OpenWrite(ftpFileUri))
                {
                    using (var sourceStream = File.OpenRead(filePath))
                    {
                        await sourceStream.CopyToAsync(destinationStream);
                    }
                }
            }
            catch (Exception error)
            {
                Console.WriteLine(error.ToString());
                throw;
            }

            return albumArtUri.Combine(fileName);
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

        private static FtpClient CreateFtpConnection()
        {
            var credentials = new NetworkCredential
            {
                UserName = ConfigurationManager.AppSettings["CdnFtpUserName"],
                Password = ConfigurationManager.AppSettings["CdnFtpPassword"]
            };
            var client = new FtpClient(credentials);
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
            var lower = input
                .Replace(':', '_')
                .Replace('/', '+')
                .Replace('é', 'e')
                .Replace('ú', 'u')
                .Replace("?", "")
                .Replace('ó', 'o')
                .Replace('í', 'i')
                .Replace('á', 'a');
            var isAscii = new Func<char, bool>(c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == ',' || c == '.');
            if (lower.All(c => isAscii(c) || char.IsNumber(c) || c == ' ' || c == '_' || c == '+'))
            {
                return lower;
            }
            else
            {
                return new string(lower.Select(c => isAscii(c) || char.IsNumber(c) || c == ' ' ? c : '_').ToArray());
            }
        }
    }
}
