var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var Song = (function () {
            function Song(song) {
                this.albumArtOrArtistImage = "";
                this.isCumulativeRank = true;
                this.albumSwatchBackground = "white";
                this.albumSwatchForeground = "black";
                this.albumSwatchMuted = "silver";
                this.albumSwatchTextShadow = "white";
                this.albumSwatchDarker = "black"; // The darker of two: either foreground or background
                this.albumSwatchLighter = "white"; // The lighter of the two: either foreground or background
                this.hasSetAlbumArtColors = false;
                this.isLyricsExpanded = false;
                this.isSongStatusExpanded = false;
                this.isSupportExpanded = false;
                this.isShareExpanded = false;
                this.isEditingLyrics = false;
                this.isShowingEmbedCode = false;
                angular.merge(this, song);
                this.clientId = song.id + "_" + (new Date().getTime() + Math.random());
            }
            Object.defineProperty(Song.prototype, "communityRankText", {
                get: function () {
                    if (this.communityRank > 0) {
                        return "+" + this.communityRank.toString();
                    }
                    return this.communityRank.toString();
                },
                enumerable: true,
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
                enumerable: true,
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
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "reasonPlayedText", {
                get: function () {
                    if (!this._reasonPlayedText) {
                        this._reasonPlayedText = this.createReasonPlayedText();
                    }
                    return this._reasonPlayedText;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "facebookShareUrl", {
                get: function () {
                    if (!this._facebookShareUrl) {
                        var name = (this.artist + " - " + this.name).replace(new RegExp("&", 'g'), "and"); // Yes, replace ampersand. Even though we escape it via encodeURIComponent, Facebook barfs on it.
                        var url = "https://messianicradio.com?song=" + this.id;
                        var albumArtUrl = "https://messianicradio.com/api/albums/art/forSong?songId=" + this.id;
                        this._facebookShareUrl = "https://www.facebook.com/dialog/feed?app_id=256833604430846" +
                            ("&link=" + url) +
                            ("&picture=" + encodeURIComponent(albumArtUrl)) +
                            ("&name=" + encodeURIComponent(name)) +
                            ("&description=" + encodeURIComponent("On " + this.album)) +
                            ("&caption=" + encodeURIComponent("Courtesy of Chavah Messianic Radio - The very best Messianic Jewish and Hebrew Roots music")) +
                            ("&redirect_uri=" + encodeURIComponent("https://messianicradio.com/#/sharethanks"));
                    }
                    return this._facebookShareUrl;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "twitterShareUrl", {
                get: function () {
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
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "googlePlusShareUrl", {
                get: function () {
                    if (!this._googlePlusShareUrl) {
                        this._googlePlusShareUrl = "https://plus.google.com/share?url=" + encodeURI("https://messianicradio.com/?song=" + this.id);
                    }
                    return this._googlePlusShareUrl;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "shareUrl", {
                get: function () {
                    return "https://messianicradio.com/?song=" + this.id;
                },
                enumerable: true,
                configurable: true
            });
            Song.prototype.getEmbedCode = function () {
                return "<iframe style=\"border-top: medium none; height: 558px; border-right: medium none; width: 350px; border-bottom: medium none; border-left: medium none\" src=\"https://messianicradio.com/home/embed?song=" + this.id + "\" scrolling=\"none\"></iframe>";
            };
            Song.prototype.updateFrom = function (other) {
                angular.merge(this, other);
            };
            Song.prototype.updateAlbumArtColors = function (album) {
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
            };
            Song.empty = function () {
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
                            case Chavah.SongPick.SongFromAlbumRequested: return "you asked to hear another song from the " + this.album + " album";
                            case Chavah.SongPick.SongFromArtistRequested: return "you asked to hear another song from " + this.artist;
                            case Chavah.SongPick.SongWithTagRequested: return "you asked to hear another song with this tag";
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
                    // e.g. "We played this song because you like this song, you love Ted Pearce, and it's one of the top-ranked songs on Chavah.
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
            // Shuffles an array. Should be moved to a utility class, or maybe just bite the bullet and include lodash.
            Song.shuffle = function (array) {
                var currentIndex = array.length, temporaryValue, randomIndex;
                // While there remain elements to shuffle...
                while (0 !== currentIndex) {
                    // Pick a remaining element...
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;
                    // And swap it with the current element.
                    temporaryValue = array[currentIndex];
                    array[currentIndex] = array[randomIndex];
                    array[randomIndex] = temporaryValue;
                }
                return array;
            };
            Song.createEmptySongPickReasons = function (songId) {
                return {
                    album: Chavah.LikeLevel.NotSpecified,
                    artist: Chavah.LikeLevel.NotSpecified,
                    ranking: Chavah.LikeLevel.NotSpecified,
                    similar: Chavah.LikeLevel.NotSpecified,
                    songThumbedUp: false,
                    songId: songId,
                    soleReason: null
                };
            };
            return Song;
        }());
        Song.defaultSwatch = {
            getBodyTextColor: function () { return "black"; },
            getHex: function () { return "white"; },
            getHsl: function () { return "black"; },
            getPopulation: function () { return 0; },
            getTitleTextColor: function () { return "black"; },
            hsl: [255, 255, 255],
            rgb: [255, 255, 255]
        };
        Chavah.Song = Song;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
