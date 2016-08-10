using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BitShuva.Models;

namespace BitShuva.Models.Indexes
{
    public class Songs_RankStandings : Raven.Client.Indexes.AbstractIndexCreationTask<Song, Songs_RankStandings.Results>
    {
        public Songs_RankStandings()
        {
            this.Map = songs => from song in songs
                                select new
                                {
                                    Standing = song.CommunityRankStanding,
                                    Count = 1
                                };
            this.Reduce = results => from result in results
                                     group result by result.Standing into standingGroup
                                     select new
                                     {
                                         Standing = standingGroup.Key,
                                         Count = standingGroup.Sum(s => s.Count)
                                     };
        }

        public class Results
        {
            public CommunityRankStanding Standing { get; set; }
            public int Count { get; set; }
        }
    }
}