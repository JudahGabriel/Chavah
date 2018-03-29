namespace BitShuva.Chavah {
    /**
     * Update's iOS lock screen information (artist, album, song, artwork, etc.) and responds to lockscreen audio UI (play/pause/next).
     *
     * Utilizes two Cordova plugins:
     * - Set lock screen information: https://github.com/leon/cordova-plugin-nowplaying
     * - Respond to audio UI: https://github.com/leon/cordova-plugin-remotecommand
     */
    export class IOSMediaSessionService {
        private nowPlaying: any | null;
        private remoteCommand: any | null;

        nowPlayingInfo: NowPlayingInfo | null = null;
        
        static $inject = [
            "audioPlayer"
        ];

        constructor(private readonly audioPlayer: AudioPlayerService) {
            
        }

        /**
         * Checks if we're in iOS app and if so, hooks up the iOS lock screen media buttons to Chavah and syncs currently playing song info to the lockscreen.
         */
        install() {
            // We need to wait until Cordova is ready.
            // NOTE: In our testing on iOS, it looks like this event can only be listened to once. Attaching multiple event handlers doesn't fire the others.
            document.addEventListener("deviceready", () => this.cordovaLoaded(), false);
        }

        private cordovaLoaded() {
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

        private listenForAudioEvents() {
            if (this.nowPlaying) {
                // Current song changed
                this.audioPlayer.song
                    .distinctUntilChanged()
                    .subscribe(song => this.songChanged(song));

                this.audioPlayer.status
                    .distinctUntilChanged()
                    .subscribe(status => this.songStatusChanged(status));

                // Current track position changed
                this.audioPlayer.playedTime
                    .distinctUntilChanged()
                    .subscribe(elapsed => this.songCurrentTimeChanged(elapsed));

                // Current song duration changed
                this.audioPlayer.duration
                    .distinctUntilChanged()
                    .subscribe(duration => this.songDurationChanged(duration));
            }
        }

        private setInitialNativeUIState() {
            if (this.remoteCommand) {
                this.remoteCommand.enabled("play", true);
                this.remoteCommand.enabled("pause", true);
                this.remoteCommand.enabled("nextTrack", true);
                this.remoteCommand.enabled("previousTrack", false);
            }
        }

        private listenForNativeUIEvents() {
            // https://github.com/leon/cordova-plugin-remotecommand
            if (this.remoteCommand) {
                this.remoteCommand.on("play", () => this.audioPlayer.resume());
                this.remoteCommand.on("pause", () => this.audioPlayer.pause());
                this.remoteCommand.on("nextTrack", () => this.audioPlayer.skipToEnd());
            }
        }

        private songChanged(song: Song | null) {
                        
            if (this.nowPlaying) {
                const metadata: NowPlayingInfo = {
                };

                if (song) {
                    metadata.albumTitle = song.album;
                    metadata.artist = song.artist;
                    metadata.title = song.hebrewName ? `${song.name} ${song.hebrewName}` : song.name;
                    metadata.artwork = `https://messianicradio.com/api/albums/getAlbumArtBySongId?songId=${song.id}`; //song.albumArtUri;
                    metadata.trackNumber = song.number;
                }

                this.nowPlayingInfo = metadata;
                this.nowPlaying.set(metadata);
            }
        }

        private songCurrentTimeChanged(elapsed: number) {
            if (this.nowPlaying && this.nowPlayingInfo) {
                // Update the track position information. Omitted properties will just use whatever was set last.
                this.nowPlayingInfo.elapsedPlaybackTime = elapsed;
                this.nowPlaying.set(this.nowPlayingInfo);
            }
        }

        private songDurationChanged(duration: number) {
            if (this.nowPlaying && this.nowPlayingInfo) {
                this.nowPlayingInfo.playbackDuration = duration;
                this.nowPlaying.set(this.nowPlayingInfo);
            }
        }

        private songStatusChanged(status: AudioStatus) {
            if (this.nowPlaying && this.nowPlayingInfo) {
                // Set the now playing info, otherwise iOS resets it using the HTML5 <audio> src.
                this.nowPlaying.set(this.nowPlayingInfo);
            }
        }
    }

    // Cordova NowPlayingInfo https://github.com/leon/cordova-plugin-nowplaying
    interface NowPlayingInfo {
        artwork?: string,
        albumTitle?: string,
        trackCount?: number,
        trackNumber?: number,
        artist?: string,
        composer?: string,
        discCount?: number,
        discNumber?: number,
        genre?: string,
        persistentID?: number,
        playbackDuration?: number,
        title?: string,
        elapsedPlaybackTime?: number,
        playbackRate?: number,
        playbackQueueIndex?: number,
        playbackQueueCount?: number,
        chapterNumber?: number,
        chapterCount?: number
    };

    App.service("iOSMediaSession", IOSMediaSessionService);
}