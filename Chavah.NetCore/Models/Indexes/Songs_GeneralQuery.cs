using Raven.Client.Documents.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models.Indexes
{
    /// <summary>
    /// RavenDB index that indexes the fields we query songs on.
    /// </summary>
    public class Songs_GeneralQuery : AbstractIndexCreationTask<Song>
    {
        public Songs_GeneralQuery()
        {
            this.Map = songs => from song in songs
                                select new
                                {
                                    __document_id = song.Id,
                                    Album = song.Album,
                                    AlbumId = song.AlbumId,
                                    Artist = song.Artist,
                                    CommunityRank = song.CommunityRank,
                                    CommunityRankStanding = song.CommunityRankStanding,
                                    Name = song.Name,
                                    Tags = song.Tags,
                                    UploadDate = song.UploadDate
                                };
        }
    }
}