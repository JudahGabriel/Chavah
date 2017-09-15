using BitShuva.Chavah.Common;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BitShuva.Chavah.Models
{
    public class Station
    {
        public Station()
        {
            this.SeedArtists = new List<string>();
            this.SeedAlbums = new List<string>();
            this.SeedSongs = new List<string>();
            this.SeedGenres = new List<string>();
        }

        public string Name { get; set; }
        public string OwnerId { get; set; }
        public List<string> SeedArtists { get; set; }
        public List<string> SeedAlbums { get; set; }
        public List<string> SeedSongs { get; set; }
        public List<string> SeedGenres { get; set; }

        public Tuple<StationSongChoice, string> PickRandomSeed()
        {
            var allElements = this.SeedArtists.Concat(this.SeedAlbums).Concat(this.SeedSongs).Concat(this.SeedGenres);
            var element = allElements.RandomElement();
            if (this.SeedArtists.Contains(element))
            {
                return Tuple.Create(StationSongChoice.Artist, element);
            }
            if (this.SeedAlbums.Contains(element))
            {
                return Tuple.Create(StationSongChoice.Album, element);
            }
            if (this.SeedGenres.Contains(element))
            {
                return Tuple.Create(StationSongChoice.Genre, element);
            }
            if (this.SeedSongs.Contains(element))
            {
                return Tuple.Create(StationSongChoice.Song, element);
            }

            return null;
        }
    }
}