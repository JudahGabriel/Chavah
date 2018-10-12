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

        public override Song ToDto(LikeStatus likeStatus, SongPickReasons pickReasons)
        {
            var song = base.ToDto(likeStatus, pickReasons);
            return FromSong(song, Option.Some<IHasAlbumSwatches>(this));
        }

        /// <summary>
        /// Creates a SongWithAlbumColors from a song. Optionally can copy color information from the object provided.
        /// </summary>
        /// <param name="song"></param>
        /// <param name="albumSwatches"></param>
        /// <returns></returns>
        public static SongWithAlbumColors FromSong(Song song, Option<IHasAlbumSwatches> albumSwatches)
        {
            var swatch = albumSwatches.ValueOrDefault();
            return FromSong(song, swatch?.AlbumSwatchForeground, swatch?.AlbumSwatchBackground, swatch?.AlbumSwatchMuted, swatch?.AlbumSwatchTextShadow);
        }

        /// <summary>
        /// Creates a SongWithAlbumColors from a song. Optionally can copy color information from the object provided.
        /// </summary>
        /// <param name="song"></param>
        /// <param name="album"></param>
        /// <returns></returns>
        public static SongWithAlbumColors FromSong(Song song, Option<Album> album)
        {
            var albumVal = album.ValueOrDefault();
            return FromSong(song, albumVal?.ForegroundColor, albumVal?.BackgroundColor, albumVal?.MutedColor, albumVal?.TextShadowColor);
        }

        public static SongWithAlbumColors FromSong(Song song, string foreground, string background, string muted, string textShadow)
        {
            var vm = new SongWithAlbumColors();
            ObjectExtensions.CopyPropsFrom(vm, song);
            
            vm.AlbumSwatchBackground = background ?? string.Empty;
            vm.AlbumSwatchForeground = foreground ?? string.Empty;
            vm.AlbumSwatchMuted = muted ?? string.Empty;
            vm.AlbumSwatchTextShadow = textShadow ?? string.Empty;
            
            return vm;
        }
    }
}
