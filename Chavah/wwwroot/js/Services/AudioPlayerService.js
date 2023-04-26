var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AudioPlayerService = /** @class */ (function () {
            function AudioPlayerService(songApi, homeViewModel) {
                var _this = this;
                this.songApi = songApi;
                this.homeViewModel = homeViewModel;
                this.status = new Rx.BehaviorSubject(Chavah.AudioStatus.Paused);
                this.song = new Rx.BehaviorSubject(null);
                this.songCompleted = new Rx.BehaviorSubject(null);
                this.playedTime = new Rx.BehaviorSubject(0);
                this.playedTimeText = new Rx.BehaviorSubject("");
                this.remainingTimeText = new Rx.BehaviorSubject("");
                this.playedTimePercentage = new Rx.BehaviorSubject(0);
                this.duration = new Rx.BehaviorSubject(0);
                this.playedSongs = [];
                this.error = new Rx.Subject();
                this.lastPlayedTime = 0;
                // Listen for when the song changes and update the document title.
                this.song
                    .subscribe(function (song) { return _this.updateDocumentTitle(song); });
            }
            AudioPlayerService.prototype.initialize = function (audio) {
                var _this = this;
                var supportsMp3Audio = Modernizr.audio.mp3;
                if (supportsMp3Audio) {
                    this.audio = audio;
                    // this.audio.addEventListener("abort", (args) => this.aborted(args));
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
                    // require(["viewmodels/upgradeBrowserDialog"],(UpgradeBrowserDialog) => {
                    //    App.showDialog(new UpgradeBrowserDialog());
                    // });
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
                var _this = this;
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
                            var playTask = this.audio.play();
                            if (playTask && playTask.catch) {
                                playTask.catch(function (taskError) {
                                    console.log("Unable to play audio due to task error", taskError);
                                    _this.status.onNext(Chavah.AudioStatus.Paused);
                                });
                            }
                        }
                        catch (error) {
                            // This can happen on mobile when we try to play before user interaction.
                            // Don't worry about it; it will remain paused until the user clicks play.
                            console.log("Unable to play audio", error);
                            this.status.onNext(Chavah.AudioStatus.Paused);
                        }
                    }
                }
            };
            AudioPlayerService.prototype.playSongById = function (songId) {
                var task = this.songApi.getSongById(songId);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongAtTrackPosition = function (songId, trackPosition) {
                var _this = this;
                if (songId) {
                    var loadSongTask = this.songApi.getSongById(songId);
                    this.playSongWhenFinishedLoading(loadSongTask)
                        .then(function (loadedSong) {
                        if (loadedSong && loadedSong.id === songId) {
                            _this.audio.currentTime = trackPosition;
                        }
                    });
                }
            };
            AudioPlayerService.prototype.playSongFromArtistAndAlbum = function (artist, album) {
                var task = this.songApi.getSongByArtistAndAlbum(artist, album);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromArtist = function (artist) {
                var task = this.songApi.getSongByArtist(artist);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromArtistId = function (artist) {
                var task = this.songApi.getSongByArtistId(artist);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromAlbum = function (album) {
                var task = this.songApi.getSongByAlbum(album);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromAlbumId = function (albumId) {
                var task = this.songApi.getSongByAlbumId(albumId);
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
                return task.then(function (songResult) {
                    var isStillWaitingForSong = _this.song.getValue() === currentSong;
                    if (isStillWaitingForSong) {
                        if (songResult) {
                            _this.playNewSong(songResult);
                            return songResult;
                        }
                        else {
                            _this.resume();
                        }
                    }
                    return _this.song.getValue();
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
            /**
             * Sets the volume level.
             * @param level Should be between 0 and 1, where 1 is full volume, and 0 is muted.
             */
            AudioPlayerService.prototype.setVolume = function (level) {
                if (this.audio) {
                    this.audio.volume = 0;
                }
            };
            AudioPlayerService.prototype.skipToEnd = function () {
                if (this.audio && this.audio.duration) {
                    this.audio.currentTime = this.audio.duration - 1;
                }
            };
            AudioPlayerService.prototype.aborted = function (args) {
                this.status.onNext(Chavah.AudioStatus.Aborted);
                console.log("Audio aborted", this.audio.currentSrc, args);
            };
            AudioPlayerService.prototype.erred = function (args) {
                var _a;
                this.status.onNext(Chavah.AudioStatus.Erred);
                var currentSong = this.song.getValue();
                var errorInfo = {
                    errorCode: ((_a = this.audio.error) === null || _a === void 0 ? void 0 : _a.code) || null,
                    songId: currentSong ? currentSong.id : "",
                    trackPosition: this.audio.currentTime,
                    mp3Url: this.audio.src || ""
                };
                this.error.onNext(errorInfo);
            };
            AudioPlayerService.prototype.ended = function () {
                var currentSong = this.song.getValue();
                if (this.audio && currentSong && (this.audio.src === currentSong.uri || this.audio.src === encodeURI(currentSong.uri))) {
                    this.songCompleted.onNext(currentSong);
                }
                this.status.onNext(Chavah.AudioStatus.Ended);
            };
            AudioPlayerService.prototype.stalled = function (args) {
                this.status.onNext(Chavah.AudioStatus.Stalled);
                console.warn("Audio stalled, unable to stream in audio data.", this.audio.currentSrc, args);
            };
            AudioPlayerService.prototype.playbackPositionChanged = function (args) {
                var currentTime = this.audio.currentTime;
                var currentTimeRounded = isNaN(currentTime) || !isFinite(currentTime) ? 0 : Math.round(currentTime);
                var currentTimeHasChanged = currentTimeRounded !== this.lastPlayedTime;
                if (currentTimeHasChanged) {
                    this.lastPlayedTime = currentTimeRounded;
                    // Update our duration and current time.
                    var duration = this.audio.duration;
                    this.duration.onNext(isNaN(duration) || !isFinite(duration) ? 0 : duration);
                    this.playedTime.onNext(currentTimeRounded);
                    var currentPositionDate = new Date().setMinutes(0, currentTimeRounded);
                    var currentPosition = moment(currentPositionDate);
                    var remainingTimeDate = new Date().setMinutes(0, duration - currentTimeRounded);
                    var remainingTime = moment(remainingTimeDate);
                    this.playedTimeText.onNext(currentPosition.format("m:ss"));
                    this.remainingTimeText.onNext(remainingTime.format("m:ss"));
                    this.playedTimePercentage.onNext((100 / duration) * currentTimeRounded);
                }
            };
            AudioPlayerService.prototype.updateDocumentTitle = function (song) {
                // Update the document title so that the browser tab updates.
                if (song) {
                    document.title = song.name + " by " + song.artist + " on " + this.homeViewModel.pageTitle;
                }
                else {
                    document.title = this.homeViewModel.pageTitle;
                }
            };
            AudioPlayerService.$inject = [
                "songApi",
                "homeViewModel"
            ];
            return AudioPlayerService;
        }());
        Chavah.AudioPlayerService = AudioPlayerService;
        Chavah.App.service("audioPlayer", AudioPlayerService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AudioPlayerService.js.map