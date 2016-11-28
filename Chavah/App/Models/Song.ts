namespace BitShuva.Chavah {
    export class Song implements Server.ISong {
        name: string;
        album: string;
        artist: string;
        artistImages: string[];
        albumArtUri: string;
        albumSongNumber: number;
        uri: string;
        likeStatus: number;
        communityRank: number;
        communityRankStanding: number;
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
        totalUpVotes: number | null;
        totalDownVotes: number | null;
        artistInfo: Server.IArtist;
        tags: string[];
        purchaseUri: string;

        albumSwatchBackground = "white";
        albumSwatchForeground = "black";
        albumSwatchMuted = "silver";
        albumSwatchTextShadow = "white";
        hasSetAlbumArtColors = false;
        clientId: string;

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

        colorClass() {
            return this.getColorClass();
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
                uri: ""
            });
        }

        private getCommunityRankTitle() {
            var standing = this.communityRankStanding;
            var rank = this.communityRank;
            var standingText =
                standing === 0 ? "Average" :
                    standing === 1 ? "Very Poor" :
                        standing === 2 ? "Poor" :
                            standing === 3 ? "Good" :
                                standing === 4 ? "Great" :
                                    "Best";
            return standingText;
        }

        private getNthSongText(): string {
            var value =
                this.albumSongNumber === 0 ? "1st" :
                    this.albumSongNumber === 1 ? "1st" :
                        this.albumSongNumber === 2 ? "2nd" :
                            this.albumSongNumber === 3 ? "3rd" :
                                this.albumSongNumber >= 4 && this.albumSongNumber <= 19 ? this.albumSongNumber + "th" :
                                    "#" + this.albumSongNumber;
            return value;
        }

        private getColorClass() {
            var rank = this.communityRank;
            var styleNumber =
                rank <= -10 ? 0 :
                    rank <= -2 ? 1 :
                        rank <= 20 ? 2 :
                            rank <= 40 ? 3 :
                                rank <= 80 ? 4 :
                                    rank <= 100 ? 5 :
                                        rank <= 120 ? 6 :
                                            rank <= 150 ? 7 :
                                                rank <= 200 ? 8 :
                                                    rank <= 250 ? 9 :
                                                        rank <= 300 ? 10 :
                                                            rank <= 350 ? 11 :
                                                                rank <= 400 ? 12 :
                                                                    rank <= 450 ? 13 :
                                                                        rank <= 500 ? 14 :
                                                                            rank <= 600 ? 15 :
                                                                                rank <= 700 ? 16 :
                                                                                    17;
            return "song-rank-" + styleNumber;
        }
    }
}