using Raven.Abstractions.Indexing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models.Indexes
{
    /// <summary>
    /// RavenDB index that indexes the fields we query songs on.
    /// </summary>
    public class Songs_GeneralQuery : Raven.Client.Indexes.AbstractIndexCreationTask<Song>
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

            Sort(nameof(Song.CommunityRank), SortOptions.Int);
            Sort("__document_id", SortOptions.String);
        }
    }
}