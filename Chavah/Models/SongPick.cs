﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public enum SongPick
    {
        RandomSong,
        VeryPoorRank,
        PoorRank,
        NormalRank,
        GoodRank,
        GreatRank,
        BestRank,
        LikedArtist,
        LikedAlbum,
        LikedSong,
        LikedTag,
        SongFromAlbumRequested,
        SongFromArtistRequested,
        SongWithTagRequested,
        YouRequestedSong,
        SomeoneRequestedSong,
    }
}