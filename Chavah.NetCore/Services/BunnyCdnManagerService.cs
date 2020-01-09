using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// CDN service that uploads media to BunnyCDN.
    /// </summary>
    /// <remarks>bunnycdn.com</remarks>
    public class BunnyCdnManagerService : ICdnManagerService
    {
        private readonly IOptions<CdnSettings> settings;
        private readonly IWebHostEnvironment hosting;
        private readonly BunnyCdnHttpClient httpClient;

        public BunnyCdnManagerService(
            BunnyCdnHttpClient httpClient,
            IOptions<CdnSettings> settings,
            IWebHostEnvironment hosting)
        {
            this.hosting = hosting;
            this.settings = settings;
            this.httpClient = httpClient;
        }

        /// <summary>
        /// Deletes a song's MP3 from the CDN.
        /// </summary>
        /// <param name="song"></param>
        /// <returns></returns>
        public async Task DeleteSongAsync(Song song)
        {
            var artistFolder = GetAlphaNumericEnglish(song.Artist);
            var directory = $"{settings.Value.MusicDirectory}/{artistFolder}";
            var fileName = GetCdnSafeSongFileName(song.Artist, song.Album, song.Number, song.Name);
            await DeleteMedia(directory, fileName);
        }

        /// <summary>
        /// Deletes the user's profile picture from the CDN.
        /// </summary>
        /// <param name="user">The user whose profile picture will be deleted.</param>
        /// <returns></returns>
        public Task DeleteProfilePicAsync(AppUser user)
        {
            if (user.ProfilePicUrl != null)
            {
                var fileName = user.ProfilePicUrl.OriginalString.Split('/').Last();
                return DeleteMedia(settings.Value.ProfilePicsDirectory, fileName);
            }

            return Task.CompletedTask;
        }

        /// <summary>
        /// Uploads album art to BunnyCDN.
        /// </summary>
        /// <param name="source">The URL where the album art can be downloaded.</param>
        /// <param name="album">The name of the album.</param>
        /// <param name="artist">The name of the album's artist.</param>
        /// <param name="fileExtension">The file extension to use.</param>
        /// <returns>The URL to the uploaded album art on the CDN.</returns>
        public Task<Uri> UploadAlbumArtAsync(Uri source, string artist, string album, string fileExtension)
        {
            var artistSafe = GetAlphaNumericEnglish(artist);
            var albumSafe = GetAlphaNumericEnglish(album);
            var destinationFileName = string.Concat(artistSafe, " - ", albumSafe, fileExtension).ToLowerInvariant();
            return UploadMedia(source, settings.Value.AlbumArtDirectory, destinationFileName);
        }

        /// <summary>
        /// Uploads artist image to the CDN.
        /// </summary>
        /// <param name="source">The URL to an existing image. This will be copied to the CDN.</param>
        /// <param name="fileName">The destination file name of the CDN.</param>
        /// <returns>The URL to the uploaded artist image on the CDN.</returns>
        public Task<Uri> UploadArtistImageAsync(Uri source, string fileName)
        {
            var safeFileName = GetAlphaNumericEnglish(Path.GetFileNameWithoutExtension(fileName));
            return UploadMedia(source, settings.Value.ArtistImagesDirectory, safeFileName);
        }

        /// <summary>
        /// Uploads the MP3 of a song to BunnyCDN.
        /// </summary>
        /// <param name="source">The URL where the MP3 resides. This will be copied to the CDN.</param>
        /// <param name="artist">The name of the artist of the song being uploaded.</param>
        /// <param name="album">The album of the song being uploaded.</param>
        /// <param name="songNumber">The number of the song on the album.</param>
        /// <param name="songName">The name of the song being uploaded.</param>
        /// <returns>The URL to the song MP3 on the CDN.</returns>
        public Task<Uri> UploadMp3Async(Uri source, string artist, string album, int songNumber, string songName)
        {
            var artistDirectory = GetAlphaNumericEnglish(artist);
            var directory = $"{settings.Value.MusicDirectory}/{artistDirectory}";
            var fileName = GetCdnSafeSongFileName(artist, album, songNumber, songName);
            return UploadMedia(source, directory, fileName);
        }

        /// <summary>
        /// Uploads a user's profile picture to BunnyCDN.
        /// </summary>
        /// <param name="source">The stream containing the image bytes.</param>
        /// <param name="contentType">The content type of the image. Should be "image/png" or "image/jpg".</param>
        /// <returns>The URL of the uploaded profile picture on the CDN.</returns>
        public Task<Uri> UploadProfilePicAsync(Stream source, string contentType)
        {
            var fileExtension = string.Equals("image/png", contentType, StringComparison.InvariantCultureIgnoreCase) ? ".png" : ".jpg";
            var fileName = Guid.NewGuid().GetHashCode().ToString() + fileExtension;
            return UploadMedia(source, settings.Value.ProfilePicsDirectory, fileName);
        }

        /// <summary>
        /// Gets the files in the specified directory.
        /// </summary>
        /// <param name="directory"></param>
        /// <returns></returns>
        public async Task<List<string>> GetFiles(string directory)
        {
            var directoryListing = await GetDirectoryListings(directory);
            return directoryListing
                .Where(l => !l.IsDirectory)
                .Select(l => l.ObjectName)
                .ToList();
        }

        /// <summary>
        /// Gets the directories in the specified directory.
        /// </summary>
        /// <param name="directory"></param>
        /// <returns></returns>
        public async Task<List<string>> GetDirectories(string directory)
        {
            var directoryListing = await GetDirectoryListings(directory);
            return directoryListing
                .Where(l => l.IsDirectory)
                .Select(l => l.ObjectName)
                .ToList();
        }

        /// <summary>
        /// Downloads a file from HTTP to a local file on disk on the web server.
        /// </summary>
        /// <param name="httpUrl">The URL of the file to download.</param>
        /// <returns>A TempFileStream containing the file path and opened stream to the file.</returns>
        private async Task<TempFileStream> DownloadTempFileLocally(Uri httpUrl)
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

            return TempFileStream.Open(tempFilePath);
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

        /// <summary>
        /// Gets a directory listing (files and directories) for the specified <paramref name="cdnPath"/>.
        /// </summary>
        /// <remarks>
        /// See https://bunnycdnstorage.docs.apiary.io/#reference/0/storagezonenamepath/get
        /// </remarks>
        /// <param name="cdnPath">The directory ("foo") or directory path ("foo/bar") to get the directory listing for.</param>
        /// <returns>The directory listings.</returns>
        private async Task<List<BunnyCdnDirectoryListing>> GetDirectoryListings(string cdnPath)
        {
            HttpResponseMessage? listingResponseOrNull = null;
            var responseJson = "";
            var url = $"{settings.Value.StorageZone}/{cdnPath}/";
            try
            {
                listingResponseOrNull = await httpClient.GetAsync(url);
                listingResponseOrNull.EnsureSuccessStatusCode();
                responseJson = await listingResponseOrNull.Content.ReadAsStringAsync();
            }
            catch (HttpRequestException listingError)
            {
                listingError.Data.Add("url", url);
                listingError.Data.Add("cdnPath", cdnPath);
                throw;
            }
            finally
            {
                listingResponseOrNull?.Dispose();
            }

            return Newtonsoft.Json.JsonConvert.DeserializeObject<List<BunnyCdnDirectoryListing>>(responseJson);
        }

        /// <summary>
        /// Uploads media by first downloading from the specified <paramref name="source"/> and them uploading to BunnyCDN in the specified directory.
        /// </summary>
        /// <param name="source">The URI where the source media can be downloaded from.</param>
        /// <param name="directory">The directory inside BunnyCDN where the file will be uploaded to.</param>
        /// <param name="fileName">The name of the file to create in BunnyCDN.</param>
        /// <returns>An HTTP URI pointing to the new file in BunnyCDN.</returns>
        private async Task<Uri> UploadMedia(Uri source, string directory, string fileName)
        {
            using var sourceFile = await DownloadTempFileLocally(source);
            return await UploadMedia(sourceFile.Stream, directory, fileName);
        }


        /// <summary>
        /// Uploads the source stream to BunnyCDN.
        /// </summary>
        /// <param name="source">The stream containing the data to upload.</param>
        /// <param name="directory">The directory in BunnyCDN to upload to.</param>
        /// <param name="fileName">The name of the file to create in BunnyCDN.</param>
        /// <returns>An HTTP URI pointing to the new file in BunnyCDN.</returns>
        private async Task<Uri> UploadMedia(Stream source, string directory, string fileName)
        {
            var url = $"{settings.Value.StorageZone}/{directory}/{fileName}";

            using var sourceStreamContent = new StreamContent(source);
            HttpResponseMessage? uploadResponseOrNull = null;
            try
            {
                uploadResponseOrNull = await httpClient.PutAsync(url, sourceStreamContent);
                uploadResponseOrNull.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException uploadError)
            {
                uploadError.Data.Add("directory", directory);
                uploadError.Data.Add("fileName", fileName);
                uploadError.Data.Add("url", url);
                if (uploadResponseOrNull != null)
                {
                    uploadError.Data.Add("statusCode", uploadResponseOrNull.StatusCode);
                    uploadError.Data.Add("reasonPhrase", uploadResponseOrNull.ReasonPhrase);
                }
                throw;
            }
            finally
            {
                uploadResponseOrNull?.Dispose();
            }

            return HttpHost.Combine(directory, fileName);
        }

        private async Task DeleteMedia(string directory, string fileName)
        {
            var url = $"{settings.Value.StorageZone}/{directory}/{fileName}";
            HttpResponseMessage? deleteResultOrNull = null;
            try
            {
                deleteResultOrNull = await httpClient.DeleteAsync(url);
                deleteResultOrNull.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException deleteError)
            {
                deleteError.Data.Add("url", url);
                if (deleteResultOrNull != null)
                {
                    deleteError.Data.Add("statusCode", deleteResultOrNull.StatusCode);
                    deleteError.Data.Add("reasonPhrase", deleteResultOrNull.ReasonPhrase);
                }
                throw;
            }
            finally
            {
                deleteResultOrNull?.Dispose();
            }
        }

        private Uri HttpHost => new Uri(settings.Value.HttpPath);
    }
}
