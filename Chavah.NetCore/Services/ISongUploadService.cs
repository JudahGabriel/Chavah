using BitShuva.Chavah.Models;

namespace BitShuva.Chavah.Services
{
    public interface ISongUploadService
    {
        void QueueMp3Upload(SongUpload song, AlbumUpload album, int songNumber, string songId);
    }
}