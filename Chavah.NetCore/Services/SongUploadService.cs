using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using Optional;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Optional.Async;
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

        public SongUploadService(
            ICdnManagerService cdnManagerService, 
            IDocumentStore db, 
            ILogger<SongUploadService> logger)
        {
            this.cdnManagerService = cdnManagerService;
            this.logger = logger;
            this.db = db;
        }

        public void QueueMp3Upload(SongUpload song, AlbumUpload album, int songNumber, string songId)
        {
            Task.Factory.StartNew(
                () => this.TryUploadMp3(song, album, songNumber, songId), 
                TaskCreationOptions.LongRunning);
        }

        private async Task TryUploadMp3(SongUpload song, AlbumUpload album, int songNumber, string songId)
        {
            var albumArtUri = Option.None<Uri>();
            try
            {
                albumArtUri = Option.Some(await cdnManagerService.UploadMp3Async(song.Address, album.Artist, album.Name, songNumber, song.FileName));
            }
            catch (Exception error)
            {
                logger.LogError(error, "Unable to upload song MP3. {songId}, {songAddress}, {fileName}, {album}, {artist}", songId, song.Address, song.FileName, album.Name, album.Artist);
                await this.TryDeleteSong(songId);
            }

            albumArtUri.MatchSome(async uri => await this.TryUpdateSongUri(songId, uri));
        }

        private async Task TryUpdateSongUri(string songId, Uri albumArtUri)
        {
            try
            {
                using (var dbSession = db.OpenAsyncSession())
                {
                    var song = await dbSession.LoadAsync<Song>(songId);
                    if (song != null)
                    {
                        song.Uri = albumArtUri;
                        await dbSession.SaveChangesAsync();
                    }
                }
            }
            catch (Exception error)
            {
                logger.LogError(error, "Upload MP3 succeeded, however, updating the Song.Uri failed. {songId}, {uri}", songId, albumArtUri);
            }
        }

        private async Task TryDeleteSong(string songId)
        {
            using (var dbSession = db.OpenAsyncSession())
            {
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
}