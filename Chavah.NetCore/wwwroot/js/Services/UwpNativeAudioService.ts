namespace BitShuva.Chavah {

    /**
     * This service hooks the web app up to Windows native audio control service, connecting the system's play/pause/volume/current song/etc.
     * to Chavah's current song.
     *
     * This is required for playing background audio in a Windows app.
     * https://stackoverflow.com/questions/49240479/enabling-background-audio-in-my-windows-store-html5-app/49242890#49242890
     */
    export class UwpNativeAudioService {
        private systemMedia: Windows.Media.SystemMediaTransportControls | null = null;

        static $inject = [
            "audioPlayer"
        ];

        constructor(
            private readonly audioPlayer: AudioPlayerService) {
        }

        /**
         * Installs hooks into the Windows OS media controls if we're running as a UWP app.
         */
        install() {
            try {
                const isOnWindows = typeof window["Windows"] != 'undefined';
                if (isOnWindows) {
                    this.systemMedia = this.tryGetSmtc();
                    if (this.systemMedia) {
                        this.setInitialSmtcState();
                        this.listenForAudioEvents();
                    }
                }
            } catch (error) {
                console.log("Unable to install Windows native audio hooks", error);
            }
        }

        private setInitialSmtcState() {
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
        }

        private tryGetSmtc(): Windows.Media.SystemMediaTransportControls | null {
            try {
                return Windows.Media.SystemMediaTransportControls.getForCurrentView();
            } catch (error) {
                console.log("Unable to get SMTC", error);
                return null;
            }
        }

        private listenForAudioEvents() {
            this.audioPlayer.status
                .distinctUntilChanged()
                .subscribe(status => this.audioStatusChanged(status));            

            this.audioPlayer.song
                .distinctUntilChanged()
                .subscribe(song => this.songChanged(song));

            if (this.systemMedia) {
                this.systemMedia.addEventListener("buttonpressed", eventIn => this.windowsMediaButtonPressed(eventIn));
                this.systemMedia.addEventListener("propertychanged", eventIn => this.windowsMediaPropertyChanged(eventIn));
            }
        }

        private windowsMediaButtonPressed(eventIn: Windows.Media.SystemMediaTransportControlsButtonPressedEventArgs) {
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
        }

        private windowsMediaPropertyChanged(eventIn: Windows.Media.SystemMediaTransportControlsPropertyChangedEventArgs) {
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
        }

        private audioStatusChanged(status: AudioStatus) {
            if (this.systemMedia) {
                switch (status) {
                    case AudioStatus.Playing:
                        this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.playing;
                        break;
                    case AudioStatus.Paused:
                        this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;
                        break;
                    case AudioStatus.Buffering:
                    case AudioStatus.Stalled:
                        this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;
                        break;
                    case AudioStatus.Ended:
                        this.systemMedia.playbackStatus = Windows.Media.MediaPlaybackStatus.changing;
                        break;
                }
            }
        }

        private songChanged(song: Song | null) {
            if (this.systemMedia) {
                if (!song) {
                    this.systemMedia.displayUpdater.clearAll();
                    return;
                }
                
                // Update the currently playing song info.
                this.systemMedia.displayUpdater.type = Windows.Media.MediaPlaybackType.music;
                const musicInfo = this.systemMedia.displayUpdater.musicProperties;
                musicInfo.artist = song.artist;
                musicInfo.albumTitle = song.album;
                musicInfo.trackNumber = song.number;
                if (song.hebrewName) {
                    musicInfo.title = `${song.name} ${song.hebrewName}`;
                } else {
                    musicInfo.title = song.name;
                }

                // Update the album art.
                if (song.albumArtUri) {
                    const thumbnailUri = new Windows.Foundation.Uri(song.albumArtUri);
                    this.systemMedia.displayUpdater.thumbnail = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(thumbnailUri);
                }

                this.systemMedia.displayUpdater.update();
            }
        }
    }

    App.service("uwpNativeAudio", UwpNativeAudioService);
}