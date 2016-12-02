namespace BitShuva.Chavah {
    export class AudioPlayerService {
        readonly status = new Rx.BehaviorSubject(AudioStatus.Paused);
        readonly song = new Rx.BehaviorSubject<Song | null>(null);
        readonly songCompleted = new Rx.BehaviorSubject<Song | null>(null);
        readonly playedTimeText = new Rx.BehaviorSubject<string>("");
        readonly remainingTimeText = new Rx.BehaviorSubject<string>("");
        readonly playedTimePercentage = new Rx.BehaviorSubject<number>(0);
        readonly duration = new Rx.BehaviorSubject<number>(0);
        playedSongs: Song[] = [];
        private audio: HTMLAudioElement;

        private lastPlayedTime = 0;

        static $inject = ["songApi"];
        
        constructor(private songApi: SongApiService) {
        }

        initialize(audio: HTMLAudioElement) {
            var supportsMp3Audio = Modernizr.audio.mp3;
            if (supportsMp3Audio) {
                this.audio = audio;
                
                //this.audio.addEventListener("abort", (args) => this.aborted(args));
                this.audio.addEventListener("ended", () => this.ended());
                this.audio.addEventListener("error", (args) => this.erred(args));
                this.audio.addEventListener("pause", () => this.status.onNext(AudioStatus.Paused));
                this.audio.addEventListener("play", () => this.status.onNext(AudioStatus.Playing));
                this.audio.addEventListener("playing", () => this.status.onNext(AudioStatus.Playing));
                this.audio.addEventListener("waiting", () => this.status.onNext(AudioStatus.Buffering));
                this.audio.addEventListener("stalled", (args) => this.stalled(args));
                this.audio.addEventListener("timeupdate", (args) => this.playbackPositionChanged(args));
            } else {
                // UPGRADE TODO
                //require(["viewmodels/upgradeBrowserDialog"],(UpgradeBrowserDialog) => {
                //    App.showDialog(new UpgradeBrowserDialog());
                //});
            }
        }

        playNewSong(song: Song) {
            var currentSong = this.song.getValue();
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
                this.audio.src = "";
                if (uri) {
                    this.audio.src = uri;
                    this.audio.load();
                    this.audio.play();
                }
            }
        }

        playSongById(songId: string) {
            var task = this.songApi.getSongById(songId);
            this.playSongWhenFinishedLoading(task);
        }

        playSongFromArtistAndAlbum(artist: string, album: string) {
            var task = this.songApi.getSongByArtistAndAlbum(artist, album);
            this.playSongWhenFinishedLoading(task);
        }

        playSongFromArtist(artist: string) {
            var task = this.songApi.getSongByArtist(artist);
            this.playSongWhenFinishedLoading(task);
        }

        playSongFromAlbum(album: string) {
            var task = this.songApi.getSongByAlbum(album);
            this.playSongWhenFinishedLoading(task);
        }

        playSongWhenFinishedLoading(task: ng.IPromise<Song>) {
            var currentSong = this.song.getValue();
            this.pause();

            task.then((s) => {
                if (this.song.getValue() === currentSong) {
                    this.playNewSong(s);
                }
            });
        }

        pauseSongById(songId: string) {
            this.pause();

            this.songApi.getSongById(songId)
                .then(song => {
                    var unwrappedSong = this.song.getValue();
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
                    //this.$scope.$broadcast("songPlayed", song);
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

        private aborted(args: any) {
            this.status.onNext(AudioStatus.Aborted);
            console.log("Audio aborted", this.audio.currentSrc, args);
        }

        private erred(args: any) {
            this.status.onNext(AudioStatus.Erred);
            console.log("Audio erred", this.audio.currentSrc, args);
        }

        private ended() {
            var currentSong = this.song.getValue();
            if (this.audio && currentSong && this.audio.src === encodeURI(currentSong.uri)) {
                this.songCompleted.onNext(currentSong);
            }

            this.status.onNext(AudioStatus.Ended);
        }

        private stalled(args: any) {
            this.status.onNext(AudioStatus.Stalled);
            console.log("Audio stalled, unable to stream in audio data.", this.audio.currentSrc, args);
        }

        private playbackPositionChanged(args: any) {
            var currentTime = this.audio.currentTime;
            var currentTimeFloored = Math.floor(currentTime);
            var currentTimeHasChanged = currentTimeFloored !== this.lastPlayedTime;
            if (currentTimeHasChanged) {
                this.lastPlayedTime = currentTimeFloored;
                var duration = this.audio.duration;
                this.duration.onNext(duration);

                var currentPositionDate = new Date().setMinutes(0, currentTimeFloored);
                var currentPosition = moment(<any>currentPositionDate);
                var remainingTimeDate = new Date().setMinutes(0, duration - currentTimeFloored);
                var remainingTime = moment(<any>remainingTimeDate);

                this.playedTimeText.onNext(currentPosition.format("m:ss"));
                this.remainingTimeText.onNext(remainingTime.format("m:ss"));
                this.playedTimePercentage.onNext((100 / duration) * currentTimeFloored);
            }
        }
    }

    App.service("audioPlayer", AudioPlayerService);
}