var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Informs the navigator.mediaSession about the current playing song in Chavah, allowing for supporting platforms to control Chavah via the lockscreen or other platform-specific UI.
         *
         * This uses the proposed navigator.mediaSession standard https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
         */
        var NavigatorMediaSessionService = /** @class */ (function () {
            function NavigatorMediaSessionService(audioPlayer) {
                this.audioPlayer = audioPlayer;
            }
            /**
             * Hooks up the browser/OS/lock screen media buttons to Chavah, if the browser supports it.
             * As of March 2018, only Chrome on Android supports this.
             */
            NavigatorMediaSessionService.prototype.install = function () {
                try {
                    var supportsMediaSession = 'mediaSession' in navigator;
                    if (supportsMediaSession) {
                        this.mediaSession = navigator['mediaSession'];
                        this.listenForUIEvents();
                        this.listenForAudioEvents();
                    }
                }
                catch (error) {
                    console.log("Unable to install navigator media session", error);
                }
            };
            NavigatorMediaSessionService.prototype.listenForUIEvents = function () {
                var _this = this;
                // Make the browser/lockscreen's audio buttons work.
                if (this.mediaSession) {
                    this.mediaSession.setActionHandler("play", function () { return _this.audioPlayer.resume(); });
                    this.mediaSession.setActionHandler("pause", function () { return _this.audioPlayer.pause(); });
                    this.mediaSession.setActionHandler("nexttrack", function () { return _this.audioPlayer.skipToEnd(); });
                }
            };
            NavigatorMediaSessionService.prototype.listenForAudioEvents = function () {
                var _this = this;
                if (this.mediaSession) {
                    this.audioPlayer.song
                        .distinctUntilChanged()
                        .subscribe(function (song) { return _this.songChanged(song); });
                    this.audioPlayer.status
                        .distinctUntilChanged()
                        .subscribe(function (status) { return _this.audioStatusChanged(status); });
                }
            };
            NavigatorMediaSessionService.prototype.audioStatusChanged = function (status) {
                // When the audio status changes, let the host platform know about it.
                // https://developer.mozilla.org/en-US/docs/Web/API/MediaSession/playbackState
                if (this.mediaSession) {
                    try {
                        switch (status) {
                            case Chavah.AudioStatus.Paused:
                                this.mediaSession.playbackState = "paused";
                                break;
                            case Chavah.AudioStatus.Playing:
                                this.mediaSession.playbackState = "playing";
                                break;
                            default:
                                this.mediaSession.playbackState = "none";
                                break;
                        }
                    }
                    catch (error) {
                        console.log("Unable to set media session playback state", error);
                    }
                }
            };
            NavigatorMediaSessionService.prototype.songChanged = function (song) {
                if (this.mediaSession) {
                    var metadata = {
                        title: "",
                        artist: "",
                        album: "",
                        artwork: []
                    };
                    if (song) {
                        metadata.album = song.album;
                        metadata.artist = song.artist;
                        metadata.title = song.hebrewName ? song.name + " " + song.hebrewName : song.name;
                        metadata.artwork.push({
                            src: song.albumArtUri,
                            sizes: "any",
                            type: "image/jpeg"
                        });
                    }
                    try {
                        this.mediaSession.metadata = new window["MediaMetadata"](metadata);
                    }
                    catch (error) {
                        console.log("unable to set mediaSession metadata", error);
                    }
                }
            };
            NavigatorMediaSessionService.$inject = [
                "audioPlayer"
            ];
            return NavigatorMediaSessionService;
        }());
        Chavah.NavigatorMediaSessionService = NavigatorMediaSessionService;
        Chavah.App.service("navigatorMediaSession", NavigatorMediaSessionService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=NavigatorMediaSessionService.js.map