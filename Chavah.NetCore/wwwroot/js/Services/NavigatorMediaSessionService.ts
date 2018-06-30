namespace BitShuva.Chavah {
    /**
     * Informs the navigator.mediaSession about the current playing song in Chavah, allowing for supporting platforms to control Chavah via the lockscreen or other platform-specific UI.
     *
     * This uses the proposed navigator.mediaSession standard https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
     */
    export class NavigatorMediaSessionService {
        private mediaSession: any | null;

        static $inject = [
            "audioPlayer"
        ];

        constructor(private readonly audioPlayer: AudioPlayerService) {

        }

        /**
         * Hooks up the browser/OS/lock screen media buttons to Chavah, if the browser supports it.
         * As of March 2018, only Chrome on Android supports this.
         */
        install() {
            try {
                const supportsMediaSession = 'mediaSession' in navigator;
                if (supportsMediaSession) {
                    this.mediaSession = navigator['mediaSession'];
                    this.listenForUIEvents();
                    this.listenForAudioEvents();
                }
            } catch (error) {
                console.log("Unable to install navigator media session", error);
            }
        }

        private listenForUIEvents() {
            // Make the browser/lockscreen's audio buttons work.
            if (this.mediaSession) {
                this.mediaSession.setActionHandler("play", () => this.audioPlayer.resume());
                this.mediaSession.setActionHandler("pause", () => this.audioPlayer.pause());
                this.mediaSession.setActionHandler("nexttrack", () => this.audioPlayer.skipToEnd());
            }
        }

        private listenForAudioEvents() {
            if (this.mediaSession) {
                this.audioPlayer.song
                    .distinctUntilChanged()
                    .subscribe(song => this.songChanged(song));

                this.audioPlayer.status
                    .distinctUntilChanged()
                    .subscribe(status => this.audioStatusChanged(status));
            }
        }

        private audioStatusChanged(status: AudioStatus) {
            // When the audio status changes, let the host platform know about it.
            // https://developer.mozilla.org/en-US/docs/Web/API/MediaSession/playbackState
            if (this.mediaSession) {
                switch (status) {
                    case AudioStatus.Paused:
                        this.mediaSession.playbackState = "paused";
                        break;

                    case AudioStatus.Playing:
                        this.mediaSession.playbackState = "playing";
                        break;

                    default:
                        this.mediaSession.playbackState = "none";
                        break;
                }
            }
        }

        private songChanged(song: Song | null) {
            type MediaImage = { // emerging web standard. https://developers.google.com/web/updates/2017/02/media-session
                src: string;
                sizes: string;
                type: string;
            };

            if (this.mediaSession) {
                const metadata = {
                    title: "",
                    artist: "",
                    album: "",
                    artwork: [] as MediaImage[]
                };

                if (song) {
                    metadata.album = song.album;
                    metadata.artist = song.artist;
                    metadata.title = song.hebrewName ? `${song.name} ${song.hebrewName}` : song.name;
                    metadata.artwork.push({
                        src: song.albumArtUri,
                        sizes: "any",
                        type: "image/jpeg"
                    });
                }

                this.mediaSession.metadata = new window["MediaMetadata"](metadata);
            }
        }
    }

    App.service("navigatorMediaSession", NavigatorMediaSessionService);
}