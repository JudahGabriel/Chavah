namespace BitShuva.Chavah {
    export class Song implements Server.ISong {
        name: string;
        album: string;
        artist: string;
        artistImages: string[];
        albumArtUri: string;
        uri: string;
        communityRank: number;
        communityRankStanding: CommunityRankStanding;
        id: string;
        thumbUpImage: string;
        thumbDownImage: string;
        communityRankColor: string;
        lyrics: string;
        number: number;
        songLike: SongLike;
        genres: string[];
        albumArtOrArtistImage = "";
        isCumulativeRank = true;
        totalPlays: number;
        artistInfo: Server.IArtist;
        tags: string[];
        purchaseUri: string;
        reasonPlayed: SongPick;

        albumSwatchBackground = "white";
        albumSwatchForeground = "black";
        albumSwatchMuted = "silver";
        albumSwatchTextShadow = "white";
        albumSwatchDarker = "black"; // The darker of two: either foreground or background
        albumSwatchLighter = "white"; // The lighter of the two: either foreground or background
        hasSetAlbumArtColors = false;
        clientId: string;
        isLyricsExpanded = false;
        isSongStatusExpanded = false;

        static readonly defaultSwatch: ISwatch = {
            getBodyTextColor: () => "black",
            getHex: () => "white",
            getHsl: () => "black",
            getPopulation: () => 0,
            getTitleTextColor: () => "black",
            hsl: [255, 255, 255],
            rgb: [255, 255, 255]
        }

        constructor(song: Server.ISong) {
            angular.merge(this, song);

            this.purchaseUri = song.purchaseUri ? song.purchaseUri : 'http://lmgtfy.com/?q=' + encodeURIComponent(this.artist + " " + this.album + " purchase");
            this.clientId = `${song.id}_${new Date().getTime() + Math.random()}`;
        }

        get communityRankText(): string {
            if (this.communityRank > 0) {
                return "+" + this.communityRank.toString();
            }

            return this.communityRank.toString();
        }

        get communityRankStandingText(): string {
            switch (this.communityRankStanding) {
                case CommunityRankStanding.Best: return "Best";
                case CommunityRankStanding.Good: return "Good";
                case CommunityRankStanding.Great: return "Great";
                case CommunityRankStanding.Poor: return "Poor";
                case CommunityRankStanding.VeryPoor: return "Very Poor";
                case CommunityRankStanding.Normal:
                default: return "Average";
            }
        }

        get nthSongText(): string {
            var value =
                this.number === 0 ? "1st" :
                    this.number === 1 ? "1st" :
                        this.number === 2 ? "2nd" :
                            this.number === 3 ? "3rd" :
                                this.number >= 4 && this.number <= 19 ? this.number + "th" :
                                    "#" + this.number;
            return value;
        }

        get reasonPlayedText(): string {

            // "we played this song because {{text}}"
            switch (this.reasonPlayed) {
                case SongPick.BestRank: return "it's one of the highest ranked songs on Chavah";
                case SongPick.GoodRank: return "it's got a good ranking";
                case SongPick.GreatRank: return "it's got great ranking";
                case SongPick.LikedAlbum: return `you like other songs on the ${this.album} album`;
                case SongPick.LikedArtist: return `you like other ${this.artist} songs`;
                case SongPick.LikedSong: return "you like this song";
                case SongPick.NormalRank: return "it's got an average ranking. Occasionally, Chavah will play songs with average rank to better understand what kind of music you like";
                case SongPick.PoorRank: return "we give even poorly ranked songs a chance";
                case SongPick.SomeoneRequestedSong: return "it was requested by a listener";
                case SongPick.SongFromAlbumRequested: return `you asked to hear another song from the ${this.album} album`;
                case SongPick.SongFromArtistRequested: return `you asked to hear another song from ${this.artist}`;
                case SongPick.VeryPoorRank: return "...well, even the lowest-ranked songs will get played sometimes :-)";
                case SongPick.YouRequestedSong: return "you asked Chavah to play it";
                case SongPick.RandomSong:
                default:
                    return "Chavah plays random songs from time to time to see what kind of music you like";
            }
        }
        
        updateFrom(other: Song) {
            angular.merge(this, other);
        }

        updateAlbumArtColors(album: Album) {
            this.hasSetAlbumArtColors = true;
            this.albumSwatchBackground = album.backgroundColor || this.albumSwatchBackground;
            this.albumSwatchForeground = album.foregroundColor || this.albumSwatchForeground;
            this.albumSwatchMuted = album.mutedColor || this.albumSwatchMuted;
            this.albumSwatchTextShadow = album.textShadowColor || this.albumSwatchTextShadow;

            // Determine whether the foreground or background is lighter. Used in the now playing page to pick a color that looks readable on near-white background.
            var bgBrightness = tinycolor(this.albumSwatchBackground).getBrightness();
            var fgBrightness = tinycolor(this.albumSwatchForeground).getBrightness();
            var isFgLighter = fgBrightness >= bgBrightness;

            this.albumSwatchLighter = isFgLighter ? this.albumSwatchForeground : this.albumSwatchBackground;
            this.albumSwatchDarker = isFgLighter ? this.albumSwatchBackground : this.albumSwatchForeground;
        }

        static empty(): Song {
            return new Song({
                album: "",
                albumArtUri: "",
                artist: "",
                communityRank: 0,
                communityRankStanding: 0,
                id: "songs/0",
                artistImages: [],
                genres: [],
                lyrics: "",
                name: "",
                number: 0,
                purchaseUri: "",
                songLike: 0,
                tags: [],
                totalPlays: 0,
                uri: "",
                reasonPlayed: SongPick.RandomSong
            });
        }

        //private getColorClass() {
        //    var rank = this.communityRank;
        //    var styleNumber =
        //        rank <= -10 ? 0 :
        //            rank <= -2 ? 1 :
        //                rank <= 20 ? 2 :
        //                    rank <= 40 ? 3 :
        //                        rank <= 80 ? 4 :
        //                            rank <= 100 ? 5 :
        //                                rank <= 120 ? 6 :
        //                                    rank <= 150 ? 7 :
        //                                        rank <= 200 ? 8 :
        //                                            rank <= 250 ? 9 :
        //                                                rank <= 300 ? 10 :
        //                                                    rank <= 350 ? 11 :
        //                                                        rank <= 400 ? 12 :
        //                                                            rank <= 450 ? 13 :
        //                                                                rank <= 500 ? 14 :
        //                                                                    rank <= 600 ? 15 :
        //                                                                        rank <= 700 ? 16 :
        //                                                                            17;
        //    return "song-rank-" + styleNumber;
        //}
    }
}