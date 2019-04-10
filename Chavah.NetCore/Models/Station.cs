using System;
using System.Collections.Generic;
using System.Linq;

using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Models
{
    public class Station
    {
        public Station()
        {
            SeedArtists = new List<string>();
            SeedAlbums = new List<string>();
            SeedSongs = new List<string>();
            SeedGenres = new List<string>();
        }

        public string Name { get; set; }
        public string OwnerId { get; set; }
        public List<string> SeedArtists { get; set; }
        public List<string> SeedAlbums { get; set; }
        public List<string> SeedSongs { get; set; }
        public List<string> SeedGenres { get; set; }

        public Tuple<StationSongChoice, string> PickRandomSeed()
        {
            var allElements = SeedArtists.Concat(SeedAlbums).Concat(SeedSongs).Concat(SeedGenres);
            var element = allElements.RandomElement();
            if (SeedArtists.Contains(element))
            {
                return Tuple.Create(StationSongChoice.Artist, element);
            }
            if (SeedAlbums.Contains(element))
            {
                return Tuple.Create(StationSongChoice.Album, element);
            }
            if (SeedGenres.Contains(element))
            {
                return Tuple.Create(StationSongChoice.Genre, element);
            }
            if (SeedSongs.Contains(element))
            {
                return Tuple.Create(StationSongChoice.Song, element);
            }

            return null;
        }
    }
}
