using System.Linq;

using Raven.Client.Documents.Indexes;

namespace BitShuva.Chavah.Models.Indexes
{
    public class Songs_AverageCommunityRank : AbstractIndexCreationTask<Song, Songs_AverageCommunityRank.Results>
    {
        public class Results
        {
            public long SongCount { get; set; }
            public long RankSum { get; set; }
            public double RankAverage { get; set; }
        }

        public Songs_AverageCommunityRank()
        {
            Map = songs => from song in songs
                           select new
                           {
                               SongCount = 1,
                               RankSum = song.CommunityRank,
                               RankAverage = 0
                           };

            Reduce = results => from result in results
                                group result by 0 into g
                                let rankSum = g.Sum(s => s.RankSum)
                                let songCount = g.Sum(s => s.SongCount)
                                select new
                                {
                                    SongCount = songCount,
                                    RankSum = rankSum,
                                    RankAverage = rankSum / songCount
                                };
        }
    }
}
