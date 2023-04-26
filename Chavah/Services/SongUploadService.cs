using System;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;
using DalSoft.Hosting.BackgroundQueue;
using Microsoft.Extensions.Logging;

using Raven.Client.Documents;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Takes a song uploaded as a temporary media file and renames it to its final file name.
    /// </summary>
    /// <remarks>
    /// Our CDN doesn't support renaming, so we actually upload a copy of the temporary media file to the CDN using the correct, desired file name, and after its successful, we delete the temporary file.
    /// </remarks>
    public class SongUploadService : ISongUploadService
    {
        private readonly ICdnManagerService cdnManagerService;
        private readonly ILogger<SongUploadService> logger;
        private readonly IDocumentStore db;
        private readonly BackgroundQueue backgroundQueue;

        public SongUploadService(
            BackgroundQueue backgroundQueue,
            ICdnManagerService cdnManagerService,
            IDocumentStore db,
            ILogger<SongUploadService> logger)
        {
            this.backgroundQueue = backgroundQueue;
            this.cdnManagerService = cdnManagerService;
            this.logger = logger;
            this.db = db;
        }

        public void MoveSongUriFromTemporaryToFinal(TempFile tempUpload, AlbumUpload album, int songNumber, string songId)
        {
            backgroundQueue.Enqueue(_ => TryMoveTemporarySongToFinalSong(tempUpload, album, songNumber, songId));
        }

        private async Task TryMoveTemporarySongToFinalSong(TempFile tempUpload, AlbumUpload album, int songNumber, string songId)
        {
            var mp3Uri = default(Uri);
            try
            {
                // Copy the song.Address (temporary file URI) to the CDN using the finalized file name.
                var uri = await cdnManagerService.UploadMp3Async(tempUpload.Url, album.Artist, album.Name, songNumber, tempUpload.Name);
                mp3Uri = uri;
            }
            catch (Exception error)
            {
                logger.LogError(error, "Unable to migrate song MP3 from temporary URI to final URI. Song will remain pointing to temporary file until you manually change the song URI. Song ID {songId} with temporary media file {songAddress}, song name {songName} on album {album} by artist {artist}", songId, tempUpload.Url, tempUpload.Name, album.Name, album.Artist);
            }

            // Success? Update the song URI.
            if (mp3Uri != null)
            {
                var updatedSongUri = await TryUpdateSongUri(songId, mp3Uri);
                if (updatedSongUri != null)
                {
                    // We were able to update the Song.Uri to the finalized file name URI.
                    // We can safely delete the temporary song.
                    await TryDeleteTempFileAsync(tempUpload.Id);
                }
            }
        }

        private async Task TryDeleteTempFileAsync(string tempFileName)
        {
            try
            {
                await cdnManagerService.DeleteTempFileAsync(tempFileName);
            }
            catch (Exception error)
            {
                logger.LogWarning(error, "Unable to delete temporary media file {name}. It should be manually deleted.", tempFileName);
            }
        }

        private async Task<Uri?> TryUpdateSongUri(string songId, Uri albumArtUri)
        {
            try
            {
                using var dbSession = db.OpenAsyncSession();
                var song = await dbSession.LoadAsync<Song>(songId);
                if (song != null)
                {
                    song.Uri = albumArtUri;
                    await dbSession.SaveChangesAsync();
                    return song.Uri;
                }
            }
            catch (Exception error)
            {
                logger.LogError(error, "Upload MP3 succeeded, however, updating the Song.Uri to the permanent file name failed. {songId}, {uri}", songId, albumArtUri);
            }

            return null;
        }
    }
}
