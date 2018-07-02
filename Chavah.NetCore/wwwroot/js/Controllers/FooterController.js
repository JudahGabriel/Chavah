var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var FooterController = /** @class */ (function () {
            function FooterController(audioPlayer, songBatch, likeApi, songRequestApi, accountApi, stationIdentifier, adAnnouncer, appNav, $scope) {
                var _this = this;
                this.audioPlayer = audioPlayer;
                this.songBatch = songBatch;
                this.likeApi = likeApi;
                this.songRequestApi = songRequestApi;
                this.accountApi = accountApi;
                this.stationIdentifier = stationIdentifier;
                this.adAnnouncer = adAnnouncer;
                this.appNav = appNav;
                this.$scope = $scope;
                this.volumeShown = false;
                this.volumeVal = new Rx.Subject();
                this.isBuffering = false;
                this.lastAudioErrorTime = null;
                this.stalledTimerHandle = null;
                this.audio = null;
                // Notify the scope when the audio status changes.
                this.audioPlayer.status
                    .debounce(100)
                    .subscribe(function (status) { return _this.audioStatusChanged(status); });
                // Update the track time. We don't use angular for this, because of the constant (per second) update.
                this.audioPlayer.playedTimeText
                    .distinctUntilChanged()
                    .subscribe(function (result) { return $(".footer .track-time").text(result); });
                this.audioPlayer.duration
                    .distinctUntilChanged()
                    .subscribe(function (result) { return $(".footer .track-duration").text(_this.getFormattedTime(result)); });
                this.audioPlayer.status
                    .distinctUntilChanged()
                    .subscribe(function (status) { return $(".footer .audio-status").text(_this.getAudioStatusText(status)); });
                this.audioPlayer.playedTimePercentage
                    .distinctUntilChanged()
                    .subscribe(function (percent) { return $(".footer .trackbar").width(percent + "%"); });
                // If we sign in, restore the volume preference for the user.
                this.accountApi.signedIn
                    .distinctUntilChanged()
                    .where(function (isSignedIn) { return isSignedIn; })
                    .subscribe(function (_) { return _this.restoreVolumeFromSignedInUser(); });
            }
            Object.defineProperty(FooterController.prototype, "likesCurrentSong", {
                get: function () {
                    var currentSong = this.audioPlayer.song.getValue();
                    if (currentSong) {
                        return currentSong.songLike === Chavah.SongLike.Liked;
                    }
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "dislikesCurrentSong", {
                get: function () {
                    var currentSong = this.audioPlayer.song.getValue();
                    if (currentSong) {
                        return currentSong.songLike === Chavah.SongLike.Disliked;
                    }
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "likeText", {
                get: function () {
                    if (this.likesCurrentSong) {
                        return "You have already liked this song. Chavah is playing it more often.";
                    }
                    return "Like this song. Chavah will play this song, and others like it, more often.";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "dislikeText", {
                get: function () {
                    if (this.dislikesCurrentSong) {
                        return "You have already disliked this song. Chavah is playing it less often.";
                    }
                    return "Dislike this song. Chavah will play this song, and others like it, less often.";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "volumeIconClass", {
                get: function () {
                    if (this.volume > .95) {
                        return "fa-volume-up";
                    }
                    if (this.volume < .05) {
                        return "fa-volume-off";
                    }
                    return "fa-volume-down";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "volume", {
                get: function () {
                    if (this.audio) {
                        return this.audio.volume;
                    }
                    return 1;
                },
                set: function (val) {
                    if (this.audio) {
                        this.audio.volume = val;
                    }
                    this.volumeVal.onNext(val);
                },
                enumerable: true,
                configurable: true
            });
            FooterController.prototype.$onInit = function () {
                var _this = this;
                this.audio = document.querySelector("#audio");
                if (!this.audio) {
                    throw new Error("Couldn't locate #audio element");
                }
                this.audioPlayer.initialize(this.audio);
                this.restoreVolumeFromSignedInUser();
                // Wait for changes to the volume level and save them.
                this.volumeVal
                    .distinctUntilChanged()
                    .debounce(2000)
                    .where(function (v) { return !!_this.accountApi.currentUser && _this.accountApi.currentUser.volume !== v; })
                    .subscribe(function (val) { return _this.saveVolumePreference(val); });
            };
            FooterController.prototype.toggleVolumnShown = function () {
                this.volumeShown = !this.volumeShown;
            };
            FooterController.prototype.isPaused = function () {
                return this.audioPlayer.status.getValue() === Chavah.AudioStatus.Paused;
            };
            FooterController.prototype.playPause = function () {
                if (this.audioPlayer.status.getValue() === Chavah.AudioStatus.Playing) {
                    this.audioPlayer.pause();
                }
                else {
                    this.audioPlayer.resume();
                }
            };
            FooterController.prototype.dislikeSong = function () {
                if (this.requireSignIn()) {
                    var currentSong_1 = this.audioPlayer.song.getValue();
                    if (currentSong_1 && currentSong_1.songLike !== Chavah.SongLike.Disliked) {
                        currentSong_1.songLike = Chavah.SongLike.Disliked;
                        this.likeApi.dislikeSong(currentSong_1.id)
                            .then(function (rank) { return currentSong_1.communityRank = rank; });
                        this.songBatch.playNext();
                    }
                }
            };
            FooterController.prototype.likeSong = function () {
                if (this.requireSignIn()) {
                    var currentSong_2 = this.audioPlayer.song.getValue();
                    if (currentSong_2 && currentSong_2.songLike !== Chavah.SongLike.Liked) {
                        currentSong_2.songLike = Chavah.SongLike.Liked;
                        this.likeApi.likeSong(currentSong_2.id)
                            .then(function (rank) { return currentSong_2.communityRank = rank; });
                    }
                }
            };
            FooterController.prototype.requestSong = function () {
                var _this = this;
                if (this.requireSignIn()) {
                    this.appNav.showSongRequestDialog()
                        .result.then(function (song) { return _this.songRequestDialogCompleted(song); });
                }
            };
            FooterController.prototype.requireSignIn = function () {
                if (this.accountApi.isSignedIn) {
                    return true;
                }
                else {
                    this.appNav.promptSignIn();
                    return false;
                }
            };
            FooterController.prototype.songRequestDialogCompleted = function (song) {
                var _this = this;
                if (song) {
                    this.audioPlayer.pause();
                    this.songRequestApi.requestSong(song)
                        .then(function () { return _this.playNextSong(); });
                }
            };
            FooterController.prototype.playNextSong = function () {
                this.audioPlayer.pause();
                // If we've got a song request, play that.
                if (this.songRequestApi.hasPendingRequest()) {
                    this.songRequestApi.playRequest();
                }
                else if (this.stationIdentifier.hasPendingAnnouncement()) {
                    // Play the station identifier if need be.
                    this.stationIdentifier.playStationIdAnnouncement();
                }
                else if (this.adAnnouncer.hasPendingAnnouncement()) {
                    this.adAnnouncer.playAdAnnouncement();
                }
                else {
                    this.songBatch.playNext();
                }
            };
            FooterController.prototype.audioStatusChanged = function (status) {
                var _this = this;
                if (status === Chavah.AudioStatus.Ended) {
                    this.playNextSong();
                }
                if (status === Chavah.AudioStatus.Erred) {
                    // If it's been more than 30 seconds since the last error, play the next song.
                    // (We don't want to always play the next song, because if we're disconnected, all audio will fail.)
                    var minSecondsBetweenErrors = 30;
                    var hasBeen30SecSinceLastError = this.lastAudioErrorTime === null || moment().diff(moment(this.lastAudioErrorTime), "seconds") > minSecondsBetweenErrors;
                    if (hasBeen30SecSinceLastError) {
                        this.playNextSong();
                    }
                    this.lastAudioErrorTime = new Date();
                }
                else if (status === Chavah.AudioStatus.Stalled) {
                    // Sometimes on mobile platforms (especially older Android) we 
                    // get into a stalled state and never recover.
                    // To rectify this, check if we're still stalled 7 seconds later
                    // and if so, play the next song.
                    if (this.stalledTimerHandle) {
                        clearTimeout(this.stalledTimerHandle);
                        this.stalledTimerHandle = setTimeout(function () {
                            if (_this.audioPlayer.status.getValue() === Chavah.AudioStatus.Stalled) {
                                _this.playNextSong();
                            }
                        }, 5000);
                    }
                }
                this.isBuffering = status === Chavah.AudioStatus.Buffering || status === Chavah.AudioStatus.Stalled;
                this.$scope.$applyAsync();
            };
            FooterController.prototype.getFormattedTime = function (totalSeconds) {
                if (isNaN(totalSeconds)) {
                    return "00";
                }
                var minutes = Math.floor(totalSeconds / 60);
                var seconds = Math.floor(totalSeconds - (minutes * 60));
                var zeroPaddedSeconds = seconds < 10 ? "0" : "";
                return minutes + ":" + zeroPaddedSeconds + seconds;
            };
            FooterController.prototype.getAudioStatusText = function (status) {
                switch (status) {
                    case Chavah.AudioStatus.Aborted: return "Unable to play";
                    case Chavah.AudioStatus.Buffering: return "Buffering...";
                    case Chavah.AudioStatus.Ended: return "Ended...";
                    case Chavah.AudioStatus.Erred: return "Encountered an error";
                    case Chavah.AudioStatus.Paused: return "Paused";
                    case Chavah.AudioStatus.Playing: return "";
                    case Chavah.AudioStatus.Stalled: return "Stalled...";
                }
            };
            FooterController.prototype.restoreVolumeFromSignedInUser = function () {
                if (this.accountApi.currentUser) {
                    // Set the volume to whatever the user last set it.
                    // Min value is 0.1, otherwise users may wonder why they don't hear audio
                    this.volume = Math.max(0.1, this.accountApi.currentUser.volume);
                }
            };
            FooterController.prototype.saveVolumePreference = function (volume) {
                if (this.accountApi.currentUser && this.accountApi.currentUser.volume !== volume) {
                    this.accountApi.currentUser.volume = volume;
                    this.accountApi.saveVolume(volume);
                }
            };
            FooterController.$inject = [
                "audioPlayer",
                "songBatch",
                "likeApi",
                "songRequestApi",
                "accountApi",
                "stationIdentifier",
                "adAnnouncer",
                "appNav",
                "$scope"
            ];
            return FooterController;
        }());
        Chavah.FooterController = FooterController;
        Chavah.App.controller("FooterController", FooterController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=FooterController.js.map