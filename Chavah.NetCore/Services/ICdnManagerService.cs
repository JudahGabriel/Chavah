using System;
using System.IO;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Manages uploading and deleting media from a content delivery network (CDN).
    /// </summary>
    public interface ICdnManagerService
    {
        /// <summary>
        /// Uploads album cover image to the CDN.
        /// </summary>
        /// <param name="source">The URL where the album art can be downloaded.</param>
        /// <param name="artist">The namer of the album's artist.</param>
        /// <param name="album">The name of the album.</param>
        /// <param name="fileExtension">The file extension to use for the file on the CDN.</param>
        /// <returns>The URL to the uploaded album art on the CDN.</returns>
        Task<Uri> UploadAlbumArtAsync(Uri source, string artist, string album, string fileExtension);

        /// <summary>
        /// Uploads an artist image to the CDN.
        /// </summary>
        /// <param name="source">Where the artist image can be downloaded from.</param>
        /// <param name="fileName">The file name to upload to the CDN.</param>
        /// <returns>The URL of the artist image on the CDN.</returns>
        Task<Uri> UploadArtistImageAsync(Uri source, string fileName);

        /// <summary>
        /// Uploads an MP3 to the CDN.
        /// </summary>
        /// <param name="source">The URL where the MP3 can be fetched.</param>
        /// <param name="artist">The artist of the song being uploaded.</param>
        /// <param name="album">The album of the song being uploaded.</param>
        /// <param name="songNumber">The number of the song on the album.</param>
        /// <param name="songName">The name of the song.</param>
        /// <returns>The URL of the uploaded song.</returns>
        Task<Uri> UploadMp3Async(Uri source, string artist, string album, int songNumber, string songName);

        /// <summary>
        /// Uploads a profile picture to the CDN.
        /// </summary>
        /// <param name="imageStream">The stream containing the image data.</param>
        /// <param name="contentType">The content type of the image. If null or empty, we assume it's a JPG.</param>
        /// <returns>The HTTP URI to the uploaded image.</returns>
        Task<Uri> UploadProfilePicAsync(Stream imageStream, string contentType);

        /// <summary>
        /// Deletes the user's profile picture from the CDN.
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        Task DeleteProfilePicAsync(AppUser user);

        /// <summary>
        /// Deletes an MP3 from the CDN.
        /// </summary>
        /// <param name="song">The song who's MP3 will be deleted.</param>
        /// <returns></returns>
        Task DeleteSongAsync(Song song);
    }
}
