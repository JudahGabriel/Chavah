using System;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;
using DalSoft.Hosting.BackgroundQueue;
using Microsoft.Extensions.Logging;

using Raven.Client.Documents;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Uploads an MP3 in the background, and when finished, updates the song.
    /// If the MP3 fails to upload, the Song is deleted from the database.
    /// </summary>
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

        public void QueueMp3Upload(SongUpload song, AlbumUpload album, int songNumber, string songId)
        {
            backgroundQueue.Enqueue(_ => TryUploadMp3(song, album, songNumber, songId));
        }

        private async Task TryUploadMp3(SongUpload song, AlbumUpload album, int songNumber, string songId)
        {
            var mp3Uri = default(Uri);
            try
            {
                var uri = await cdnManagerService.UploadMp3Async(song.Address, album.Artist, album.Name, songNumber, song.FileName);
                mp3Uri = uri;
            }
            catch (Exception error)
            {
                logger.LogError(error, "Unable to upload song MP3. {songId}, {songAddress}, {fileName}, {album}, {artist}", songId, song.Address, song.FileName, album.Name, album.Artist);
                await TryDeleteSong(songId);
            }

            if (mp3Uri != null)
            {
                await TryUpdateSongUri(songId, mp3Uri);
            }
        }

        private async Task TryUpdateSongUri(string songId, Uri albumArtUri)
        {
            try
            {
                using var dbSession = db.OpenAsyncSession();
                var song = await dbSession.LoadAsync<Song>(songId);
                if (song != null)
                {
                    song.Uri = albumArtUri;
                    await dbSession.SaveChangesAsync();
                }
            }
            catch (Exception error)
            {
                logger.LogError(error, "Upload MP3 succeeded, however, updating the Song.Uri failed. {songId}, {uri}", songId, albumArtUri);
            }
        }

        private async Task TryDeleteSong(string songId)
        {
            using var dbSession = db.OpenAsyncSession();
            try
            {
                dbSession.Delete(songId);
                await dbSession.SaveChangesAsync();
            }
            catch (Exception error)
            {
                logger.LogError(error, "Tried to delete song since the MP3 failed to upload, but the song couldn't be deleted. {songId}", songId);
            }
        }
    }
}
