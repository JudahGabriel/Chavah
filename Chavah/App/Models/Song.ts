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
        //reasonPlayed: SongPick;
        reasonsPlayed: Server.ISongPickReasons | null;

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
        isSupportExpanded = false;
        isShareExpanded = false;
        isEditingLyrics = false;
        isShowingEmbedCode = false;
        private _facebookShareUrl: string | null;
        private _googlePlusShareUrl: string | null;
        private _twitterShareUrl: string | null;

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

            var randomReason = "Chavah plays random songs from time to time to see what kind of music you like";
            if (this.reasonsPlayed) {

                // If there's a sole reason, just list that.
                if (this.reasonsPlayed.soleReason !== null) {
                    switch (this.reasonsPlayed.soleReason) {
                        case SongPick.SomeoneRequestedSong: return "it was requested by a listener";
                        case SongPick.SongFromAlbumRequested: return `you asked to hear another song from the ${this.album} album`;
                        case SongPick.SongFromArtistRequested: return `you asked to hear another song from ${this.artist}`;
                        case SongPick.VeryPoorRank: return "...well, even the lowest-ranked songs will get played sometimes :-)";
                        case SongPick.YouRequestedSong: return "you asked Chavah to play it";
                        case SongPick.RandomSong:
                        default:
                            return randomReason;
                    }
                }

                // There is zero or more reasons we played this.
                var reasons: string[] = [];
                if (this.reasonsPlayed.bestRanking) {
                    reasons.push("it's one of the highest ranked songs on Chavah");
                } else if (this.reasonsPlayed.greatRanking) {
                    reasons.push("it's got a great community ranking");
                } else if (this.reasonsPlayed.goodRanking) {
                    reasons.push("it's got a good community ranking");
                }

                
                if (this.reasonsPlayed.lovedAlbum) {
                    reasons.push(`you love ${this.album}`);
                } else if (this.reasonsPlayed.likedAlbum) {
                    reasons.push(`you like ${this.album}`);
                }

                if (this.reasonsPlayed.lovedArtist) {
                    reasons.push(`you love ${this.artist} and have thumbed-up an abundance of ${this.artist} songs`)
                } else if (this.reasonsPlayed.likedArtist) {
                    reasons.push(`you like ${this.artist}`);
                }

                if (this.reasonsPlayed.likedSong) {
                    reasons.push("you like this song");
                }

                if (this.reasonsPlayed.lovedTags.length > 0) {
                    var lovedText = this.reasonsPlayed.lovedTags.slice(3).join(", ");
                    reasons.push(`you love similiar songs (songs with ${lovedText}, etc.)`);
                } else if (this.reasonsPlayed.likedTags.length > 0) {
                    var lovedText = this.reasonsPlayed.likedTags.slice(3).join(", ");
                    reasons.push(`you like similiar songs (songs with ${lovedText}, etc.)`);
                }
                
                // We're going to join all the reasons together into a single, comma-delimited string.
                // e.g. "We played this song because you like this song, you love Ted Pearce, and it's one of the top-ranked songs on Chavah.

                // No reasons? 
                if (reasons.length === 0) {
                    return `you might like it`;
                }

                if (reasons.length === 1) {
                    return reasons[0];
                }

                if (reasons.length === 2) {
                    return reasons.join(" and ");
                }

                // Append "and" to the last reason if there's more than one.
                reasons[reasons.length - 1] = "and " + reasons[reasons.length - 1];
                return reasons.join(", ");
            }

            return randomReason;
        }

        get facebookShareUrl(): string {
            if (!this._facebookShareUrl) {
                var name = `${this.artist} - ${this.name}`.replace(new RegExp("&", 'g'), "and"); // Yes, replace ampersand. Even though we escape it via encodeURIComponent, Facebook barfs on it.
                var url = `https://messianicradio.com?song=${this.id}`;
                var albumArtUrl = `https://messianicradio.com/api/albums/art/get?artist=${encodeURIComponent(this.artist)}&Album=${encodeURIComponent(this.album)}`;
                this._facebookShareUrl = "https://www.facebook.com/dialog/feed?app_id=256833604430846" +
                    `&link=${url}` +
                    `&picture=${encodeURIComponent(albumArtUrl)}` +
                    `&name=${encodeURIComponent(name)}` +
                    `&description=${encodeURIComponent("On " + this.album)}` +
                    `&caption=${encodeURIComponent("Courtesy of Chavah Messianic Radio - The very best Messianic Jewish and Hebrew Roots music")}` +
                    `&redirect_uri=${encodeURIComponent("https://messianicradio.com/#/sharethanks")}`;
            }
            
            return this._facebookShareUrl;
        }

        get twitterShareUrl(): string {
            if (!this._twitterShareUrl) {
                var tweetText = 'Listening to "' + this.artist + " - " + this.name + '"';
                var url = "https://messianicradio.com/?song=" + this.id;
                var via = "messianicradio";
                this._twitterShareUrl = "https://twitter.com/share" +
                    "?text=" + encodeURIComponent(tweetText) +
                    "&url=" + encodeURIComponent(url) +
                    "&via=" + encodeURIComponent(via);
            }

            return this._twitterShareUrl;
        }

        get googlePlusShareUrl(): string {
            if (!this._googlePlusShareUrl) {
                this._googlePlusShareUrl = "https://plus.google.com/share?url=" + encodeURI("https://messianicradio.com/?song=" + this.id);
            }

            return this._googlePlusShareUrl;
        }

        get shareUrl(): string {
            return "https://messianicradio.com/?song=" + this.id;
        }

        getEmbedCode(): string {
            return `<iframe style="border-top: medium none; height: 558px; border-right: medium none; width: 350px; border-bottom: medium none; border-left: medium none" src="http://messianicradio.com/home/embed?song=${this.id}" scrolling="none"></iframe>`;
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
                reasonsPlayed: this.createEmptySongPickReasons("songs/0")
            });
        }

        setSolePickReason(reason: SongPick) {
            this.reasonsPlayed = Song.createEmptySongPickReasons(this.id);
            this.reasonsPlayed.soleReason = reason;
        }

        static createEmptySongPickReasons(songId: string): Server.ISongPickReasons {
            return {
                likedAlbum: false,
                likedArtist: false,
                likedSong: false,
                likedTags: [],
                lovedAlbum: false,
                lovedArtist: false,
                lovedTags: [],
                bestRanking: false,
                goodRanking: false,
                greatRanking: false,
                soleReason: null,
                songId: songId
            };
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