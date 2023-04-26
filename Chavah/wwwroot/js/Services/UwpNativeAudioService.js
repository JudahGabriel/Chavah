var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * This service hooks the web app up to Windows native audio control service, connecting the system's play/pause/volume/current song/etc.
         * to Chavah's current song.
         *
         * This is required for playing background audio in a Windows app.
         * https://stackoverflow.com/questions/49240479/enabling-background-audio-in-my-windows-store-html5-app/49242890#49242890
         */
        var UwpNativeAudioService = /** @class */ (function () {
            function UwpNativeAudioService(audioPlayer) {
                this.audioPlayer = audioPlayer;
                this.systemMedia = null;
            }
            /**
             * Installs hooks into the Windows OS media controls if we're running as a UWP app.
             */
            UwpNativeAudioService.prototype.install = function () {
                try {
                    var isOnWindows = typeof window["Windows"] != 'undefined';
                    if (isOnWindows) {
                        this.systemMedia = this.tryGetSmtc();
                        if (this.systemMedia) {
                            this.setInitialSmtcState();
                            this.listenForAudioEvents();
                        }
                    }
                }
                catch (error) {
                    console.log("Unable to install Windows native audio hooks", error);
                }
            };
            UwpNativeAudioService.prototype.setInitialSmtcState = function () {
                if (this.systemMedia) {
                    this.systemMedia.isNextEnabled = true;
                    this.systemMedia.isPreviousEnabled = false;
                    this.systemMedia.isFastForwardEnabled = false;
                    this.systemMedia.isRewindEnabled = false;
                    // These 3 are required for background media playback. https://github.com/Microsoft/Windows-universal-samples/blob/dev/Samples/SystemMediaTransportControls/js/js/scenario1.js#L113
                    this.systemMedia.isStopEnabled = true;
                    this.systemMedia.isPlayEnabled = true;
                    this.systemMedia.isPauseEnabled = true;
                    this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.changing;
                    this.systemMedia.isEnabled = true;
                }
            };
            UwpNativeAudioService.prototype.tryGetSmtc = function () {
                try {
                    return Windows.Media.SystemMediaTransportControls.getForCurrentView();
                }
                catch (error) {
                    console.log("Unable to get SMTC", error);
                    return null;
                }
            };
            UwpNativeAudioService.prototype.listenForAudioEvents = function () {
                var _this = this;
                this.audioPlayer.status
                    .distinctUntilChanged()
                    .subscribe(function (status) { return _this.audioStatusChanged(status); });
                this.audioPlayer.song
                    .distinctUntilChanged()
                    .subscribe(function (song) { return _this.songChanged(song); });
                if (this.systemMedia) {
                    this.systemMedia.addEventListener("buttonpressed", function (eventIn) { return _this.windowsMediaButtonPressed(eventIn); });
                    this.systemMedia.addEventListener("propertychanged", function (eventIn) { return _this.windowsMediaPropertyChanged(eventIn); });
                }
            };
            UwpNativeAudioService.prototype.windowsMediaButtonPressed = function (eventIn) {
                var mediaButton = Windows.Media.SystemMediaTransportControlsButton;
                switch (eventIn.button) {
                    case mediaButton.play:
                        this.audioPlayer.resume();
                        break;
                    case mediaButton.pause:
                        this.audioPlayer.pause();
                        break;
                    case mediaButton.next:
                        this.audioPlayer.skipToEnd();
                        break;
                }
            };
            UwpNativeAudioService.prototype.windowsMediaPropertyChanged = function (eventIn) {
                // COMMENTED OUT: We're seeing some weirdness with how Windows sends this event, causing our app to be muted until manually adjusting the volume. Commented out until we can better diagnose what's going on.
                //if (this.systemMedia) {
                //    if (eventIn.property == Windows.Media.SystemMediaTransportControlsProperty.soundLevel) {
                //        switch (this.systemMedia.soundLevel) {
                //            case Windows.Media.SoundLevel.muted:
                //                this.audioPlayer.pause();
                //                break;
                //            case Windows.Media.SoundLevel.full:
                //                this.audioPlayer.resume();
                //                this.audioPlayer.setVolume(1);
                //                break;
                //            case Windows.Media.SoundLevel.low:
                //                this.audioPlayer.resume();
                //                this.audioPlayer.setVolume(2);
                //                break;
                //        }
                //    }
                //}
            };
            UwpNativeAudioService.prototype.audioStatusChanged = function (status) {
                if (this.systemMedia) {
                    switch (status) {
                        case Chavah.AudioStatus.Playing:
                            this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.playing;
                            break;
                        case Chavah.AudioStatus.Paused:
                            this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;
                            break;
                        case Chavah.AudioStatus.Buffering:
                        case Chavah.AudioStatus.Stalled:
                            this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;
                            break;
                        case Chavah.AudioStatus.Ended:
                            this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.changing;
                            break;
                    }
                }
            };
            UwpNativeAudioService.prototype.songChanged = function (song) {
                if (this.systemMedia) {
                    if (!song) {
                        this.systemMedia.displayUpdater.clearAll();
                        return;
                    }
                    // Update the currently playing song info.
                    this.systemMedia.displayUpdater.type = Windows.Media.MediaPlaybackType.music;
                    var musicInfo = this.systemMedia.displayUpdater.musicProperties;
                    musicInfo.artist = song.artist;
                    musicInfo.albumTitle = song.album;
                    musicInfo.trackNumber = song.number;
                    if (song.hebrewName) {
                        musicInfo.title = song.name + " " + song.hebrewName;
                    }
                    else {
                        musicInfo.title = song.name;
                    }
                    // Update the album art.
                    if (song.albumArtUri) {
                        var thumbnailUri = new Windows.Foundation.Uri(song.albumArtUri);
                        this.systemMedia.displayUpdater.thumbnail = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(thumbnailUri);
                    }
                    this.systemMedia.displayUpdater.update();
                }
            };
            UwpNativeAudioService.$inject = [
                "audioPlayer"
            ];
            return UwpNativeAudioService;
        }());
        Chavah.UwpNativeAudioService = UwpNativeAudioService;
        Chavah.App.service("uwpNativeAudio", UwpNativeAudioService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=UwpNativeAudioService.js.map