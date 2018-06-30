using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BitShuva.Chavah.Models;
using Raven.Client.Documents.Indexes;

namespace BitShuva.Chavah.Models.Indexes
{
    /// <summary>
    /// RavenDB index that groups songs by CommunityRankStanding.
    /// Used for generating the list of songs from which our song picker algorithm chooses a song based on user preferences.
    /// </summary>
    public class Songs_RankStandings : AbstractIndexCreationTask<Song, Songs_RankStandings.Result>
    {
        public Songs_RankStandings()
        {
            this.Map = songs => from song in songs
                                select new Result
                                {
                                    Standing = song.CommunityRankStanding,
                                    SongIds = new List<string> { song.Id }
                                };
            this.Reduce = results => from result in results
                                     group result by result.Standing into standingGroup
                                     select new
                                     {
                                         Standing = standingGroup.Key,
                                         SongIds = standingGroup.SelectMany(s => s.SongIds)
                                     };
        }

        public class Result
        {
            public CommunityRankStanding Standing { get; set; }
            public List<string> SongIds { get; set; }
        }
    }
}