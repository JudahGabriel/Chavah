
namespace BitShuva.Chavah {
    export class AudioPlayerService {

        static $inject = [
            "songApi",
            "homeViewModel"
        ];

        readonly status = new Rx.BehaviorSubject(AudioStatus.Paused);
        readonly song = new Rx.BehaviorSubject<Song | null>(null);
        readonly songCompleted = new Rx.BehaviorSubject<Song | null>(null);
        readonly playedTime = new Rx.BehaviorSubject<number>(0);
        readonly playedTimeText = new Rx.BehaviorSubject<string>("");
        readonly remainingTimeText = new Rx.BehaviorSubject<string>("");
        readonly playedTimePercentage = new Rx.BehaviorSubject<number>(0);
        readonly duration = new Rx.BehaviorSubject<number>(0);
        playedSongs: Song[] = [];
        private audio: HTMLAudioElement;
        readonly error = new Rx.Subject<IAudioErrorInfo>();

        private lastPlayedTime = 0;

        constructor(
            private readonly songApi: SongApiService,
            private readonly homeViewModel: Server.HomeViewModel) {

            // Listen for when the song changes and update the document title.
            this.song
                .subscribe(song => this.updateDocumentTitle(song));
        }

        initialize(audio: HTMLAudioElement) {
            let supportsMp3Audio = Modernizr.audio.mp3;
            if (supportsMp3Audio) {
                this.audio = audio;

                // this.audio.addEventListener("abort", (args) => this.aborted(args));
                this.audio.addEventListener("ended", () => this.ended());
                this.audio.addEventListener("error", args => this.erred(args));
                this.audio.addEventListener("pause", () => this.status.onNext(AudioStatus.Paused));
                this.audio.addEventListener("play", () => this.status.onNext(AudioStatus.Playing));
                this.audio.addEventListener("playing", () => this.status.onNext(AudioStatus.Playing));
                this.audio.addEventListener("waiting", () => this.status.onNext(AudioStatus.Buffering));
                this.audio.addEventListener("stalled", args => this.stalled(args));
                this.audio.addEventListener("timeupdate", args => this.playbackPositionChanged(args));
            } else {
                // UPGRADE TODO
                // require(["viewmodels/upgradeBrowserDialog"],(UpgradeBrowserDialog) => {
                //    App.showDialog(new UpgradeBrowserDialog());
                // });
            }
        }

        playNewSong(song: Song) {
            let currentSong = this.song.getValue();
            if (currentSong) {
                this.playedSongs.unshift(currentSong);
                if (this.playedSongs.length > 3) {
                    this.playedSongs.length = 3;
                }
            }

            this.song.onNext(song);
            this.playNewUri(song.uri);
        }

        playNewUri(uri: string) {
            if (this.audio) {
                //this.audio.src = "";
                if (this.audio.src === uri) {
                    this.audio.currentTime = 0;
                }

                if (uri) {
                    this.audio.src = uri;
                    this.audio.load();

                    try {
                        // On modern browsers, play will return a promise.
                        const playTask = this.audio.play();
                        if (playTask && playTask.catch) {
                            playTask.catch(taskError => {
                                console.log("Unable to play audio due to task error", taskError);
                                this.status.onNext(AudioStatus.Paused);
                            });
                        }
                    } catch (error) {
                        // This can happen on mobile when we try to play before user interaction.
                        // Don't worry about it; it will remain paused until the user clicks play.
                        console.log("Unable to play audio", error);
                        this.status.onNext(AudioStatus.Paused);
                    }
                }
            }
        }

        playSongById(songId: string) {
            const task = this.songApi.getSongById(songId);
            this.playSongWhenFinishedLoading(task);
        }

        playSongAtTrackPosition(songId: string, trackPosition: number) {
            if (songId) {
                const loadSongTask = this.songApi.getSongById(songId);
                this.playSongWhenFinishedLoading(loadSongTask)
                    .then(loadedSong => {
                        if (loadedSong && loadedSong.id === songId) {
                            this.audio.currentTime = trackPosition;
                        }
                    });
            }
        }

        playSongFromArtistAndAlbum(artist: string, album: string) {
            const task = this.songApi.getSongByArtistAndAlbum(artist, album);
            this.playSongWhenFinishedLoading(task);
        }

        playSongFromArtist(artist: string) {
            const task = this.songApi.getSongByArtist(artist);
            this.playSongWhenFinishedLoading(task);
        }

        playSongFromArtistId(artist: string) {
            const task = this.songApi.getSongByArtistId(artist);
            this.playSongWhenFinishedLoading(task);
        }

        playSongFromAlbum(album: string) {
            const task = this.songApi.getSongByAlbum(album);
            this.playSongWhenFinishedLoading(task);
        }

        playSongFromAlbumId(albumId: string) {
            const task = this.songApi.getSongByAlbumId(albumId);
            this.playSongWhenFinishedLoading(task);
        }

        playSongWithTag(tag: string) {
            const task = this.songApi.getSongWithTag(tag);
            this.playSongWhenFinishedLoading(task);
        }

        playSongWhenFinishedLoading(task: ng.IPromise<Song | null>): ng.IPromise<Song | null> {
            let currentSong = this.song.getValue();
            this.pause();

            return task.then(songResult => {
                let isStillWaitingForSong = this.song.getValue() === currentSong;
                if (isStillWaitingForSong) {
                    if (songResult) {
                        this.playNewSong(songResult);
                        return songResult;
                    } else {
                        this.resume();
                    }
                }

                return this.song.getValue();
            });
        }

        pauseSongById(songId: string) {
            this.pause();

            this.songApi.getSongById(songId)
                .then(song => {
                    if (!song) {
                        this.resume();
                        return;
                    }

                    let unwrappedSong = this.song.getValue();
                    if (unwrappedSong) {
                        this.playedSongs.unshift(unwrappedSong);
                    }

                    // Set the current song and URI. But don't play it.
                    this.song.onNext(song);
                    if (this.audio) {
                        this.audio.src = song.uri;
                        this.audio.load();
                        this.audio.pause();
                    }
                });
        }

        resume() {
            if (this.audio) {
                this.audio.play();
            }
        }

        pause() {
            if (this.audio) {
                this.audio.pause();
            }
        }

        /**
         * Sets the volume level.
         * @param level Should be between 0 and 1, where 1 is full volume, and 0 is muted.
         */
        setVolume(level: number) {
            if (this.audio) {
                this.audio.volume = 0;
            }
        }

        skipToEnd() {
            if (this.audio && this.audio.duration) {
                this.audio.currentTime = this.audio.duration - 1;
            }
        }

        private aborted(args: any) {
            this.status.onNext(AudioStatus.Aborted);
            console.log("Audio aborted", this.audio.currentSrc, args);
        }

        private erred(args: ErrorEvent) {
            this.status.onNext(AudioStatus.Erred);
            const currentSong = this.song.getValue();
            const errorInfo: IAudioErrorInfo = {
                errorCode: this.audio.error,
                songId: currentSong ? currentSong.id : "",
                trackPosition: this.audio.currentTime
            };
            this.error.onNext(errorInfo);
        }

        private ended() {
            const currentSong = this.song.getValue();
            if (this.audio && currentSong && (this.audio.src === currentSong.uri || this.audio.src === encodeURI(currentSong.uri))) {
                this.songCompleted.onNext(currentSong);
            }

            this.status.onNext(AudioStatus.Ended);
        }

        private stalled(args: any) {
            this.status.onNext(AudioStatus.Stalled);            
            console.log("Audio stalled, unable to stream in audio data.", this.audio.currentSrc, args);
        }

        private playbackPositionChanged(args: any) {
            const currentTime = this.audio.currentTime;
            const currentTimeRounded = isNaN(currentTime) || !isFinite(currentTime) ? 0 : Math.round(currentTime);
            const currentTimeHasChanged = currentTimeRounded !== this.lastPlayedTime;
            if (currentTimeHasChanged) {
                this.lastPlayedTime = currentTimeRounded;

                // Update our duration and current time.
                const duration = this.audio.duration;
                this.duration.onNext(isNaN(duration) || !isFinite(duration) ? 0 : duration);
                this.playedTime.onNext(currentTimeRounded);

                const currentPositionDate = new Date().setMinutes(0, currentTimeRounded);
                const currentPosition = moment(currentPositionDate);
                const remainingTimeDate = new Date().setMinutes(0, duration - currentTimeRounded);
                const remainingTime = moment(remainingTimeDate);

                this.playedTimeText.onNext(currentPosition.format("m:ss"));
                this.remainingTimeText.onNext(remainingTime.format("m:ss"));
                this.playedTimePercentage.onNext((100 / duration) * currentTimeRounded);
            }
        }

        private updateDocumentTitle(song: Song | null) {
            // Update the document title so that the browser tab updates.
            if (song) {
                document.title = `${song.name} by ${song.artist} on ${this.homeViewModel.pageTitle}`;
            } else {
                document.title = this.homeViewModel.pageTitle;
            }
        }
    }

    App.service("audioPlayer", AudioPlayerService);
}
