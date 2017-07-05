using BitShuva.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Raven.Client.Linq.Indexing;
using Raven.Abstractions.Indexing;

namespace BitShuva.Models.Indexes
{
    public class Songs_Search : Raven.Client.Indexes.AbstractIndexCreationTask<Song, Songs_Search.Results>
    {
        public Songs_Search()
        {
            Map = songs => from song in songs
                           select new
                           {
                               Name = song.Name.Boost(3),
                               HebrewName = song.HebrewName.Boost(3),
                               Artist = song.Artist,
                               Album = song.Album
                           };

            Analyze(r => r.Name, "Lucene.Net.Analysis.Standard.StandardAnalyzer");
            Analyze(r => r.Artist, "Lucene.Net.Analysis.Standard.StandardAnalyzer");
            Analyze(r => r.Album, "Lucene.Net.Analysis.Standard.StandardAnalyzer");
            Analyze(r => r.HebrewName, "Lucene.Net.Analysis.Standard.StandardAnalyzer");
            Index(r => r.Name, FieldIndexing.Analyzed);
            Index(r => r.Artist, FieldIndexing.Analyzed);
            Index(r => r.Album, FieldIndexing.Analyzed);
            Index(r => r.HebrewName, FieldIndexing.Analyzed);
            Suggestion(r => r.Name);
            Suggestion(r => r.Artist);
            Suggestion(r => r.Album);
            Suggestion(r => r.HebrewName);
        }

        public class Results
        {
            public string Name { get; set; }
            public string HebrewName { get; set; }
            public string Artist { get; set; }
            public string Album { get; set; }
        }
    }
}