var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var Song = /** @class */ (function () {
            function Song(song) {
                this.albumArtOrArtistImage = "";
                this.isCumulativeRank = true;
                this.albumSwatchDarker = "black"; // The darker of two: either foreground or background
                this.albumSwatchLighter = "white"; // The lighter of the two: either foreground or background
                this.isLyricsExpanded = false;
                this.isSongStatusExpanded = false;
                this.isSupportExpanded = false;
                this.isShareExpanded = false;
                this.isEditingLyrics = false;
                this.isShowingEmbedCode = false;
                this.areCommentsExpanded = false;
                angular.merge(this, song);
                // Store which album color, background or foreground, is lighter.
                // TODO: this should probably be stored on the Album and Song.
                if (song.albumColors) {
                    this.updateAlbumSwatchLighterDarker();
                }
                this.clientId = song.id + "_" + (new Date().getTime() + Math.random());
            }
            Object.defineProperty(Song.prototype, "communityRankText", {
                get: function () {
                    if (this.communityRank > 0) {
                        return "+" + this.communityRank.toString();
                    }
                    return this.communityRank.toString();
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "communityRankStandingText", {
                get: function () {
                    switch (this.communityRankStanding) {
                        case Chavah.CommunityRankStanding.Best: return "Best";
                        case Chavah.CommunityRankStanding.Good: return "Good";
                        case Chavah.CommunityRankStanding.Great: return "Great";
                        case Chavah.CommunityRankStanding.Poor: return "Poor";
                        case Chavah.CommunityRankStanding.VeryPoor: return "Very Poor";
                        case Chavah.CommunityRankStanding.Normal:
                        default: return "Average";
                    }
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "nthSongText", {
                get: function () {
                    var value = this.number === 0 ? "1st" :
                        this.number === 1 ? "1st" :
                            this.number === 2 ? "2nd" :
                                this.number === 3 ? "3rd" :
                                    this.number >= 4 && this.number <= 19 ? this.number + "th" :
                                        "#" + this.number;
                    return value;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "reasonPlayedText", {
                get: function () {
                    if (!this._reasonPlayedText) {
                        this._reasonPlayedText = this.createReasonPlayedText();
                    }
                    return this._reasonPlayedText;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "url", {
                get: function () {
                    return "/?song=" + this.id.toLowerCase();
                },
                enumerable: false,
                configurable: true
            });
            Song.prototype.updateFrom = function (other) {
                angular.merge(this, other);
            };
            Song.prototype.updateAlbumSwatchLighterDarker = function () {
                var bgOrDefault = this.albumColors.background || "black";
                var fgOrDefault = this.albumColors.foreground || "white";
                // Determine whether the foreground or background is lighter.
                // Used in the now playing page to pick a color that looks readable on near-white background.
                var bgBrightness = tinycolor(bgOrDefault).getBrightness();
                var fgBrightness = tinycolor(fgOrDefault).getBrightness();
                var isFgLighter = fgBrightness >= bgBrightness;
                this.albumSwatchLighter = isFgLighter ? fgOrDefault : bgOrDefault;
                this.albumSwatchDarker = isFgLighter ? bgOrDefault : fgOrDefault;
            };
            // tslint:disable-next-line:member-ordering
            Song.empty = function () {
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
                    },
                    commentCount: 0
                });
            };
            Song.prototype.setSolePickReason = function (reason) {
                this.reasonsPlayed = Song.createEmptySongPickReasons(this.id);
                this.reasonsPlayed.soleReason = reason;
            };
            Song.prototype.createReasonPlayedText = function () {
                // "we played this song because {{text}}"
                var randomReason = "Chavah plays random songs from time to time to see what kind of music you like";
                if (this.reasonsPlayed) {
                    // If there's a sole reason, just list that.
                    if (this.reasonsPlayed.soleReason !== null) {
                        switch (this.reasonsPlayed.soleReason) {
                            case Chavah.SongPick.SomeoneRequestedSong: return "it was requested by a listener";
                            // tslint:disable-next-line:max-line-length
                            case Chavah.SongPick.SongFromAlbumRequested: return "you asked to hear another song from the " + this.album + " album";
                            // tslint:disable-next-line:max-line-length
                            case Chavah.SongPick.SongFromArtistRequested: return "you asked to hear another song from " + this.artist;
                            case Chavah.SongPick.SongWithTagRequested: return "you asked to hear another song with this tag";
                            // tslint:disable-next-line:max-line-length
                            case Chavah.SongPick.VeryPoorRank: return "...well, even the lowest-ranked songs will get played sometimes :-)";
                            case Chavah.SongPick.YouRequestedSong: return "you asked Chavah to play it";
                            case Chavah.SongPick.RandomSong:
                            default:
                                return randomReason;
                        }
                    }
                    // There are zero or more reasons we played this.
                    var reasons = [];
                    if (this.reasonsPlayed.ranking === Chavah.LikeLevel.Favorite) {
                        reasons.push("it's one of the highest ranked songs on Chavah");
                    }
                    else if (this.reasonsPlayed.ranking === Chavah.LikeLevel.Love) {
                        reasons.push("it's got a great community ranking");
                    }
                    else if (this.reasonsPlayed.ranking === Chavah.LikeLevel.Like) {
                        reasons.push("it's got a good community ranking");
                    }
                    if (this.reasonsPlayed.artist === Chavah.LikeLevel.Favorite) {
                        reasons.push(this.artist + " is one of your favorite artists");
                    }
                    else if (this.reasonsPlayed.artist === Chavah.LikeLevel.Love) {
                        reasons.push("you love " + this.artist + " and have thumbed-up an abundance of " + this.artist + " songs");
                    }
                    else if (this.reasonsPlayed.artist === Chavah.LikeLevel.Like) {
                        reasons.push("you like " + this.artist);
                    }
                    if (this.reasonsPlayed.album === Chavah.LikeLevel.Favorite) {
                        reasons.push("you like nearly all the songs on " + this.album);
                    }
                    if (this.reasonsPlayed.album === Chavah.LikeLevel.Love) {
                        reasons.push("you love " + this.album);
                    }
                    else if (this.reasonsPlayed.album === Chavah.LikeLevel.Like) {
                        reasons.push("you like " + this.album);
                    }
                    if (this.reasonsPlayed.songThumbedUp) {
                        reasons.push("you like this song");
                    }
                    if (this.reasonsPlayed.similar === Chavah.LikeLevel.Favorite) {
                        reasons.push("it's similar to some of your favorite songs");
                    }
                    else if (this.reasonsPlayed.similar === Chavah.LikeLevel.Love) {
                        reasons.push("you love similiar songs");
                    }
                    else if (this.reasonsPlayed.similar === Chavah.LikeLevel.Like) {
                        reasons.push("you like similiar songs");
                    }
                    // We're going to join all the reasons together into a single, comma-delimited string.
                    // e.g. "We played this song because you like this song, you love Ted Pearce,
                    // and it's one of the top-ranked songs on Chavah.
                    // No reasons?
                    if (reasons.length === 0) {
                        return "you might like it";
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
            };
            // tslint:disable-next-line:member-ordering
            Song.createEmptySongPickReasons = function (songId) {
                return {
                    album: Chavah.LikeLevel.NotSpecified,
                    artist: Chavah.LikeLevel.NotSpecified,
                    ranking: Chavah.LikeLevel.NotSpecified,
                    similar: Chavah.LikeLevel.NotSpecified,
                    songThumbedUp: false,
                    songId: songId,
                    soleReason: null,
                };
            };
            // tslint:disable-next-line:member-ordering
            Song.defaultSwatch = {
                getBodyTextColor: function () { return "black"; },
                getHex: function () { return "white"; },
                getHsl: function () { return "black"; },
                getPopulation: function () { return 0; },
                getTitleTextColor: function () { return "black"; },
                hsl: [255, 255, 255],
                rgb: [255, 255, 255],
            };
            return Song;
        }());
        Chavah.Song = Song;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=Song.js.map