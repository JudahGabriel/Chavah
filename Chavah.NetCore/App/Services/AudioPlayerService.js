var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AudioPlayerService = (function () {
            function AudioPlayerService(songApi) {
                this.songApi = songApi;
                this.status = new Rx.BehaviorSubject(Chavah.AudioStatus.Paused);
                this.song = new Rx.BehaviorSubject(null);
                this.songCompleted = new Rx.BehaviorSubject(null);
                this.playedTimeText = new Rx.BehaviorSubject("");
                this.remainingTimeText = new Rx.BehaviorSubject("");
                this.playedTimePercentage = new Rx.BehaviorSubject(0);
                this.duration = new Rx.BehaviorSubject(0);
                this.playedSongs = [];
                this.audioErrors = new Rx.Subject();
                this.lastPlayedTime = 0;
                // Commented out: finding out about audio errors on the client turns out to not be very useful; it's often caused by client-side issues outside our control (bad internet connection, etc.)
                // Listen for audio errors.
                //this.audioErrors
                //    .throttle(10000) // If the CDN is down, we don't want to submit thousands of errors. Throttle it.
                //    .subscribe(val => this.submitAudioError(val));
            }
            AudioPlayerService.prototype.initialize = function (audio) {
                var _this = this;
                var supportsMp3Audio = Modernizr.audio.mp3;
                if (supportsMp3Audio) {
                    this.audio = audio;
                    //this.audio.addEventListener("abort", (args) => this.aborted(args));
                    this.audio.addEventListener("ended", function () { return _this.ended(); });
                    this.audio.addEventListener("error", function (args) { return _this.erred(args); });
                    this.audio.addEventListener("pause", function () { return _this.status.onNext(Chavah.AudioStatus.Paused); });
                    this.audio.addEventListener("play", function () { return _this.status.onNext(Chavah.AudioStatus.Playing); });
                    this.audio.addEventListener("playing", function () { return _this.status.onNext(Chavah.AudioStatus.Playing); });
                    this.audio.addEventListener("waiting", function () { return _this.status.onNext(Chavah.AudioStatus.Buffering); });
                    this.audio.addEventListener("stalled", function (args) { return _this.stalled(args); });
                    this.audio.addEventListener("timeupdate", function (args) { return _this.playbackPositionChanged(args); });
                }
                else {
                    // UPGRADE TODO
                    //require(["viewmodels/upgradeBrowserDialog"],(UpgradeBrowserDialog) => {
                    //    App.showDialog(new UpgradeBrowserDialog());
                    //});
                }
            };
            AudioPlayerService.prototype.playNewSong = function (song) {
                var currentSong = this.song.getValue();
                if (currentSong) {
                    this.playedSongs.unshift(currentSong);
                    if (this.playedSongs.length > 3) {
                        this.playedSongs.length = 3;
                    }
                }
                this.song.onNext(song);
                this.playNewUri(song.uri);
            };
            AudioPlayerService.prototype.playNewUri = function (uri) {
                if (this.audio) {
                    this.audio.src = "";
                    if (uri) {
                        this.audio.src = uri;
                        this.audio.load();
                        try {
                            this.audio.play();
                        }
                        catch (error) {
                            // This can happen on mobile when we try to play before user interaction. Don't worry about it; it will remain paused until the user clicks play.
                            console.log("Unable to play audio", error);
                        }
                    }
                }
            };
            AudioPlayerService.prototype.playSongById = function (songId) {
                var task = this.songApi.getSongById(songId);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromArtistAndAlbum = function (artist, album) {
                var task = this.songApi.getSongByArtistAndAlbum(artist, album);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromArtist = function (artist) {
                var task = this.songApi.getSongByArtist(artist);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromAlbum = function (album) {
                var task = this.songApi.getSongByAlbum(album);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongWithTag = function (tag) {
                var task = this.songApi.getSongWithTag(tag);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongWhenFinishedLoading = function (task) {
                var _this = this;
                var currentSong = this.song.getValue();
                this.pause();
                task.then(function (songResult) {
                    var isStillWaitingForSong = _this.song.getValue() === currentSong;
                    if (isStillWaitingForSong) {
                        if (songResult) {
                            _this.playNewSong(songResult);
                        }
                        else {
                            _this.resume();
                        }
                    }
                });
            };
            AudioPlayerService.prototype.pauseSongById = function (songId) {
                var _this = this;
                this.pause();
                this.songApi.getSongById(songId)
                    .then(function (song) {
                    if (!song) {
                        _this.resume();
                        return;
                    }
                    var unwrappedSong = _this.song.getValue();
                    if (unwrappedSong) {
                        _this.playedSongs.unshift(unwrappedSong);
                    }
                    // Set the current song and URI. But don't play it.
                    _this.song.onNext(song);
                    if (_this.audio) {
                        _this.audio.src = song.uri;
                        _this.audio.load();
                        _this.audio.pause();
                    }
                });
            };
            AudioPlayerService.prototype.resume = function () {
                if (this.audio) {
                    this.audio.play();
                }
            };
            AudioPlayerService.prototype.pause = function () {
                if (this.audio) {
                    this.audio.pause();
                }
            };
            AudioPlayerService.prototype.aborted = function (args) {
                this.status.onNext(Chavah.AudioStatus.Aborted);
                console.log("Audio aborted", this.audio.currentSrc, args);
            };
            AudioPlayerService.prototype.erred = function (args) {
                this.status.onNext(Chavah.AudioStatus.Erred);
                console.log("Audio erred. Error code: ", this.audio.error, "Audio source: ", this.audio.currentSrc, "Error event: ", args);
                var currentSong = this.song.getValue();
                this.audioErrors.onNext({
                    errorCode: this.audio.error,
                    songId: currentSong ? currentSong.id : "",
                    trackPosition: this.audio.currentTime
                });
            };
            AudioPlayerService.prototype.ended = function () {
                var currentSong = this.song.getValue();
                if (this.audio && currentSong && this.audio.src === encodeURI(currentSong.uri)) {
                    this.songCompleted.onNext(currentSong);
                }
                this.status.onNext(Chavah.AudioStatus.Ended);
            };
            AudioPlayerService.prototype.stalled = function (args) {
                this.status.onNext(Chavah.AudioStatus.Stalled);
                console.log("Audio stalled, unable to stream in audio data.", this.audio.currentSrc, args);
            };
            AudioPlayerService.prototype.playbackPositionChanged = function (args) {
                var currentTime = this.audio.currentTime;
                var currentTimeFloored = Math.floor(currentTime);
                var currentTimeHasChanged = currentTimeFloored !== this.lastPlayedTime;
                if (currentTimeHasChanged) {
                    this.lastPlayedTime = currentTimeFloored;
                    var duration = this.audio.duration;
                    this.duration.onNext(duration);
                    var currentPositionDate = new Date().setMinutes(0, currentTimeFloored);
                    var currentPosition = moment(currentPositionDate);
                    var remainingTimeDate = new Date().setMinutes(0, duration - currentTimeFloored);
                    var remainingTime = moment(remainingTimeDate);
                    this.playedTimeText.onNext(currentPosition.format("m:ss"));
                    this.remainingTimeText.onNext(remainingTime.format("m:ss"));
                    this.playedTimePercentage.onNext((100 / duration) * currentTimeFloored);
                }
            };
            AudioPlayerService.prototype.submitAudioError = function (val) {
                this.songApi.songFailed(val);
            };
            return AudioPlayerService;
        }());
        AudioPlayerService.$inject = ["songApi"];
        Chavah.AudioPlayerService = AudioPlayerService;
        Chavah.App.service("audioPlayer", AudioPlayerService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
