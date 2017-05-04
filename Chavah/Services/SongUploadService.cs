using BitShuva.Common;
using BitShuva.Models;
using Optional;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Optional.Async;

namespace BitShuva.Services
{
    /// <summary>
    /// Uploads an MP3 in the background, and when finished, updates the song.
    /// If the MP3 fails to upload, the Song is deleted from the database.
    /// </summary>
    public class SongUploadService
    {
        public void QueueMp3Upload(SongUpload song, AlbumUpload album, int songNumber, string songId)
        {
            System.Web.Hosting.HostingEnvironment.QueueBackgroundWorkItem(_ => this.TryUploadMp3(song, album, songNumber, songId));
        }

        private async Task TryUploadMp3(SongUpload song, AlbumUpload album, int songNumber, string songId)
        {
            var albumArtUri = Option.None<Uri>();
            try
            {
                albumArtUri = Option.Some(await CdnManager.UploadMp3ToCdn(song.Address, album.Artist, album.Name, songNumber, song.FileName));
            }
            catch (Exception error)
            {
                await new LoggerService().Error("Unable to upload song MP3", error.ToString(), (songId: songId, address: song.Address, fileName: song.FileName, album: album.Name, artist: album.Artist));
                await this.TryDeleteSong(songId);
            }

            albumArtUri.MatchSome(async uri => await this.TryUpdateSongUri(songId, uri));
        }

        private async Task TryUpdateSongUri(string songId, Uri albumArtUri)
        {
            try
            {
                using (var dbSession = RavenContext.Db.OpenAsyncSession())
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
                await new LoggerService().Error("Upload MP3 succeeded, however, updating the Song.Uri failed.", error.ToString(), (songId: songId, uri: albumArtUri));
            }
        }

        private async Task TryDeleteSong(string songId)
        {
            using (var dbSession = RavenContext.Db.OpenAsyncSession())
            {
                try
                {
                    dbSession.Delete(songId);
                    await dbSession.SaveChangesAsync();
                }
                catch (Exception error)
                {
                    await new LoggerService().Error("Tried to delete song since the MP3 failed to upload, but the song couldn't be deleted.", error.ToString(), songId);
                }
            }
        }
    }
}