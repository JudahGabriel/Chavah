using System.Linq;

using Raven.Client.Documents.Indexes;

namespace BitShuva.Chavah.Models.Indexes
{
    /// <summary>
    /// RavenDB index that indexes the fields we query songs on.
    /// </summary>
    public class Songs_GeneralQuery : AbstractIndexCreationTask<Song>
    {
        public Songs_GeneralQuery()
        {
            Map = songs => from song in songs
                                select new
                                {
                                    __document_id = song.Id,
                                    song.Album,
                                    song.AlbumId,
                                    song.Artist,
                                    song.CommunityRank,
                                    song.CommunityRankStanding,
                                    song.Name,
                                    song.Tags,
                                    song.UploadDate,
                                    song.ArtistId
                                };
        }
    }
}
