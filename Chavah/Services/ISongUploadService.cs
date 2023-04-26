using BitShuva.Chavah.Models;

namespace BitShuva.Chavah.Services
{
    public interface ISongUploadService
    {
        void MoveSongUriFromTemporaryToFinal(TempFile song, AlbumUpload album, int songNumber, string songId);
    }
}
