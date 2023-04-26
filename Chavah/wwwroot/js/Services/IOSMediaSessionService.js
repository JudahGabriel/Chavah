var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Update's iOS lock screen information (artist, album, song, artwork, etc.) and responds to lockscreen audio UI (play/pause/next).
         *
         * Utilizes two Cordova plugins:
         * - Set lock screen information: https://github.com/leon/cordova-plugin-nowplaying
         * - Respond to audio UI: https://github.com/leon/cordova-plugin-remotecommand
         */
        var IOSMediaSessionService = /** @class */ (function () {
            function IOSMediaSessionService(audioPlayer) {
                this.audioPlayer = audioPlayer;
                this.nowPlayingInfo = null;
            }
            /**
             * Checks if we're in iOS app and if so, hooks up the iOS lock screen media buttons to Chavah and syncs currently playing song info to the lockscreen.
             */
            IOSMediaSessionService.prototype.install = function () {
                var _this = this;
                // We need to wait until Cordova is ready.
                // NOTE: In our testing on iOS, it looks like this event can only be listened to once. Attaching multiple event handlers doesn't fire the others.
                document.addEventListener("deviceready", function () { return _this.cordovaLoaded(); }, false);
            };
            IOSMediaSessionService.prototype.cordovaLoaded = function () {
                try {
                    // https://github.com/leon/cordova-plugin-nowplaying
                    this.nowPlaying = window["NowPlaying"];
                    if (this.nowPlaying) {
                        this.listenForAudioEvents();
                    }
                    // https://github.com/leon/cordova-plugin-remotecommand
                    this.remoteCommand = window["RemoteCommand"];
                    if (this.remoteCommand) {
                        this.setInitialNativeUIState();
                        this.listenForNativeUIEvents();
                    }
                }
                catch (error) {
                    console.log("Error installing iOS Cordova hooks for media session", error);
                }
            };
            IOSMediaSessionService.prototype.listenForAudioEvents = function () {
                var _this = this;
                if (this.nowPlaying) {
                    // Current song changed
                    this.audioPlayer.song
                        .distinctUntilChanged()
                        .subscribe(function (song) { return _this.songChanged(song); });
                    this.audioPlayer.status
                        .distinctUntilChanged()
                        .subscribe(function (status) { return _this.songStatusChanged(status); });
                    // Current track position changed
                    this.audioPlayer.playedTime
                        .distinctUntilChanged()
                        .subscribe(function (elapsed) { return _this.songCurrentTimeChanged(elapsed); });
                    // Current song duration changed
                    this.audioPlayer.duration
                        .distinctUntilChanged()
                        .subscribe(function (duration) { return _this.songDurationChanged(duration); });
                }
            };
            IOSMediaSessionService.prototype.setInitialNativeUIState = function () {
                if (this.remoteCommand) {
                    this.remoteCommand.enabled("play", true);
                    this.remoteCommand.enabled("pause", true);
                    this.remoteCommand.enabled("nextTrack", true);
                    this.remoteCommand.enabled("previousTrack", false);
                }
            };
            IOSMediaSessionService.prototype.listenForNativeUIEvents = function () {
                var _this = this;
                // https://github.com/leon/cordova-plugin-remotecommand
                if (this.remoteCommand) {
                    this.remoteCommand.on("play", function () { return _this.audioPlayer.resume(); });
                    this.remoteCommand.on("pause", function () { return _this.audioPlayer.pause(); });
                    this.remoteCommand.on("nextTrack", function () { return _this.audioPlayer.skipToEnd(); });
                }
            };
            IOSMediaSessionService.prototype.songChanged = function (song) {
                if (this.nowPlaying) {
                    var metadata = {};
                    if (song) {
                        metadata.albumTitle = song.album;
                        metadata.artist = song.artist;
                        metadata.title = song.hebrewName ? song.name + " " + song.hebrewName : song.name;
                        metadata.trackNumber = song.number;
                        // Artwork must be on our domain. Send it to our domain with a redirect to the CDN.
                        metadata.artwork = "https://messianicradio.com/api/albums/getAlbumArtBySongId?songId=" + song.id;
                    }
                    this.nowPlayingInfo = metadata;
                    this.nowPlaying.set(metadata);
                }
            };
            IOSMediaSessionService.prototype.songCurrentTimeChanged = function (elapsed) {
                if (this.nowPlaying && this.nowPlayingInfo) {
                    // Update the track position information. Omitted properties will just use whatever was set last.
                    this.nowPlayingInfo.elapsedPlaybackTime = elapsed;
                    this.nowPlaying.set(this.nowPlayingInfo);
                }
            };
            IOSMediaSessionService.prototype.songDurationChanged = function (duration) {
                if (this.nowPlaying && this.nowPlayingInfo) {
                    this.nowPlayingInfo.playbackDuration = duration;
                    this.nowPlaying.set(this.nowPlayingInfo);
                }
            };
            IOSMediaSessionService.prototype.songStatusChanged = function (status) {
                if (this.nowPlaying && this.nowPlayingInfo) {
                    // Set the now playing info, otherwise iOS resets it using the HTML5 <audio> src.
                    this.nowPlaying.set(this.nowPlayingInfo);
                }
            };
            IOSMediaSessionService.$inject = [
                "audioPlayer"
            ];
            return IOSMediaSessionService;
        }());
        Chavah.IOSMediaSessionService = IOSMediaSessionService;
        ;
        Chavah.App.service("iOSMediaSession", IOSMediaSessionService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=IOSMediaSessionService.js.map