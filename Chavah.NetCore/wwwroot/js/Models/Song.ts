namespace BitShuva.Chavah {
    export class Song implements Server.Song {
        name: string;
        hebrewName: string | null;
        album: string;
        artist: string;
        artistId: string;
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
        artistInfo: Server.Artist;
        tags: string[];
        purchaseUri: string;
        // reasonPlayed: SongPick;
        reasonsPlayed: Server.SongPickReasons | null;
        albumId: string | null;
        albumColors: Server.AlbumColors;

        //albumSwatchBackground = "white";
        //albumSwatchForeground = "black";
        //albumSwatchMuted = "silver";
        //albumSwatchTextShadow = "white";
        albumSwatchDarker = "black"; // The darker of two: either foreground or background
        albumSwatchLighter = "white"; // The lighter of the two: either foreground or background
        clientId: string;
        isLyricsExpanded = false;
        isSongStatusExpanded = false;
        isSupportExpanded = false;
        isShareExpanded = false;
        isEditingLyrics = false;
        isShowingEmbedCode = false;

        private _reasonPlayedText: string | null;

        // tslint:disable-next-line:member-ordering
        static readonly defaultSwatch: ISwatch = {
            getBodyTextColor: () => "black",
            getHex: () => "white",
            getHsl: () => "black",
            getPopulation: () => 0,
            getTitleTextColor: () => "black",
            hsl: [255, 255, 255],
            rgb: [255, 255, 255],
        };

        constructor(song: Server.Song) {
            angular.merge(this, song);

            // Store which album color, background or foreground, is lighter.
            // TODO: this should probably be stored on the Album and Song.
            if (song.albumColors) {
                this.updateAlbumSwatchLighterDarker();
            }
            
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
            let value =
                this.number === 0 ? "1st" :
                    this.number === 1 ? "1st" :
                        this.number === 2 ? "2nd" :
                            this.number === 3 ? "3rd" :
                                this.number >= 4 && this.number <= 19 ? this.number + "th" :
                                    "#" + this.number;
            return value;
        }

        get reasonPlayedText(): string {
            if (!this._reasonPlayedText) {
                this._reasonPlayedText = this.createReasonPlayedText();
            }

            return this._reasonPlayedText;
        }

        get url(): string {
            return `/?song=${this.id.toLowerCase()}`;
        }

        updateFrom(other: Song) {
            angular.merge(this, other);
        }

        private updateAlbumSwatchLighterDarker() {
            const bgOrDefault = this.albumColors.background || "black";
            const fgOrDefault = this.albumColors.foreground || "white";

            // Determine whether the foreground or background is lighter.
            // Used in the now playing page to pick a color that looks readable on near-white background.
            const bgBrightness = tinycolor(bgOrDefault).getBrightness();
            const fgBrightness = tinycolor(fgOrDefault).getBrightness();
            const isFgLighter = fgBrightness >= bgBrightness;

            this.albumSwatchLighter = isFgLighter ? fgOrDefault : bgOrDefault;
            this.albumSwatchDarker = isFgLighter ? bgOrDefault : fgOrDefault;
        }

        // tslint:disable-next-line:member-ordering
        static empty(): Song {
            return new Song({
                album: "",
                albumId: "",
                albumArtUri: "",
                artist: "",
                artistId: "",
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
                reasonsPlayed: this.createEmptySongPickReasons("songs/0"),
                albumColors: {
                    background: "",
                    foreground: "",
                    muted: "",
                    textShadow: ""
                }
            });
        }

        setSolePickReason(reason: SongPick) {
            this.reasonsPlayed = Song.createEmptySongPickReasons(this.id);
            this.reasonsPlayed.soleReason = reason;
        }

        private createReasonPlayedText(): string {
            // "we played this song because {{text}}"

            let randomReason = "Chavah plays random songs from time to time to see what kind of music you like";
            if (this.reasonsPlayed) {

                // If there's a sole reason, just list that.
                if (this.reasonsPlayed.soleReason !== null) {
                    switch (this.reasonsPlayed.soleReason) {
                        case SongPick.SomeoneRequestedSong: return "it was requested by a listener";
                        // tslint:disable-next-line:max-line-length
                        case SongPick.SongFromAlbumRequested: return `you asked to hear another song from the ${this.album} album`;
                        // tslint:disable-next-line:max-line-length
                        case SongPick.SongFromArtistRequested: return `you asked to hear another song from ${this.artist}`;
                        case SongPick.SongWithTagRequested: return `you asked to hear another song with this tag`;
                        // tslint:disable-next-line:max-line-length
                        case SongPick.VeryPoorRank: return "...well, even the lowest-ranked songs will get played sometimes :-)";
                        case SongPick.YouRequestedSong: return "you asked Chavah to play it";
                        case SongPick.RandomSong:
                        default:
                            return randomReason;
                    }
                }

                // There are zero or more reasons we played this.
                let reasons: string[] = [];
                if (this.reasonsPlayed.ranking === LikeLevel.Favorite) {
                    reasons.push("it's one of the highest ranked songs on Chavah");
                } else if (this.reasonsPlayed.ranking === LikeLevel.Love) {
                    reasons.push("it's got a great community ranking");
                } else if (this.reasonsPlayed.ranking === LikeLevel.Like) {
                    reasons.push("it's got a good community ranking");
                }

                if (this.reasonsPlayed.artist === LikeLevel.Favorite) {
                    reasons.push(`${this.artist} is one of your favorite artists`);
                } else if (this.reasonsPlayed.artist === LikeLevel.Love) {
                    reasons.push(`you love ${this.artist} and have thumbed-up an abundance of ${this.artist} songs`);
                } else if (this.reasonsPlayed.artist === LikeLevel.Like) {
                    reasons.push(`you like ${this.artist}`);
                }

                if (this.reasonsPlayed.album === LikeLevel.Favorite) {
                    reasons.push(`you like nearly all the songs on ${this.album}`);
                }
                if (this.reasonsPlayed.album === LikeLevel.Love) {
                    reasons.push(`you love ${this.album}`);
                } else if (this.reasonsPlayed.album === LikeLevel.Like) {
                    reasons.push(`you like ${this.album}`);
                }

                if (this.reasonsPlayed.songThumbedUp) {
                    reasons.push("you like this song");
                }

                if (this.reasonsPlayed.similar === LikeLevel.Favorite) {
                    reasons.push("it's similar to some of your favorite songs");
                } else if (this.reasonsPlayed.similar === LikeLevel.Love) {
                    reasons.push("you love similiar songs");
                } else if (this.reasonsPlayed.similar === LikeLevel.Like) {
                    reasons.push("you like similiar songs");
                }

                // We're going to join all the reasons together into a single, comma-delimited string.
                // e.g. "We played this song because you like this song, you love Ted Pearce,
                // and it's one of the top-ranked songs on Chavah.

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
        
        // tslint:disable-next-line:member-ordering
        static createEmptySongPickReasons(songId: string): Server.SongPickReasons {
            return {
                album: LikeLevel.NotSpecified,
                artist: LikeLevel.NotSpecified,
                ranking: LikeLevel.NotSpecified,
                similar: LikeLevel.NotSpecified,
                songThumbedUp: false,
                songId,
                soleReason: null,
            };
        }
    }
}
