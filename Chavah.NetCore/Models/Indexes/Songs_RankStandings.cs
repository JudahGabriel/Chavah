#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;

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
            Map = songs => from song in songs
                           select new Result
                           {
                               Standing = song.CommunityRankStanding,
                               SongIds = new List<string> { song.Id },
                               SongUploadDates = new List<DateTime> { song.UploadDate }
                           };

            Reduce = results => from result in results
                                group result by result.Standing into standingGroup
                                select new
                                {
                                    Standing = standingGroup.Key,
                                    SongIds = standingGroup.SelectMany(s => s.SongIds),
                                    SongUploadDates = standingGroup.SelectMany(s => s.SongUploadDates)
                                };
        }

        public class Result
        {
            public CommunityRankStanding Standing { get; set; }
            public List<string> SongIds { get; set; } = new List<string>();
            public List<DateTime> SongUploadDates { get; set; } = new List<DateTime>();
        }
    }
}

#nullable enable
