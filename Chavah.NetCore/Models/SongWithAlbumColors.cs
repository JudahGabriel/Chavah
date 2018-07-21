using BitShuva.Chavah.Common;
using Optional;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A <see cref="Song"/> that also contains the album swatch colors loaded from its associated <see cref="Song.Album"/>.
    /// </summary>
    public class SongWithAlbumColors : Song, IHasAlbumSwatches
    {
        public string AlbumSwatchBackground { get; set; }
        public string AlbumSwatchForeground { get; set; }
        public string AlbumSwatchMuted { get; set; }
        public string AlbumSwatchTextShadow { get; set; }

        /// <summary>
        /// Creates a SongWithAlbumColors from a song. Optionally can copy color information from the object provided.
        /// </summary>
        /// <param name="song"></param>
        /// <param name="albumSwatches"></param>
        /// <returns></returns>
        public static SongWithAlbumColors FromSong(Song song, Option<IHasAlbumSwatches> albumSwatches)
        {
            var vm = new SongWithAlbumColors();
            ObjectExtensions.CopyPropsFrom(vm, song);
            albumSwatches.MatchSome(s =>
            {
                vm.AlbumSwatchBackground = s.AlbumSwatchBackground;
                vm.AlbumSwatchForeground = s.AlbumSwatchForeground;
                vm.AlbumSwatchMuted = s.AlbumSwatchMuted;
                vm.AlbumSwatchTextShadow = s.AlbumSwatchTextShadow;
            });

            return vm;
        }
    }
}
