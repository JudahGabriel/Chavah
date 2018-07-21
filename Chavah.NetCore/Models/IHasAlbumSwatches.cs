using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    public interface IHasAlbumSwatches
    {
        string AlbumSwatchBackground { get; set; }
        string AlbumSwatchForeground { get; set; }
        string AlbumSwatchMuted { get; set; }
        string AlbumSwatchTextShadow { get; set; }
    }
}
