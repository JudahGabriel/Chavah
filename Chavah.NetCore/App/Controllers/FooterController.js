var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var FooterController = (function () {
            function FooterController(audioPlayer, songBatch, likeApi, songRequestApi, accountApi, stationIdentifier, appNav, $scope) {
                var _this = this;
                this.audioPlayer = audioPlayer;
                this.songBatch = songBatch;
                this.likeApi = likeApi;
                this.songRequestApi = songRequestApi;
                this.accountApi = accountApi;
                this.stationIdentifier = stationIdentifier;
                this.appNav = appNav;
                this.$scope = $scope;
                this.volumeShown = false;
                this.volume = 1;
                this.isBuffering = false;
                var audio = document.querySelector("#audio");
                this.audioPlayer.initialize(audio);
                this.volume = audio.volume;
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
                $scope.$watch(function () { return _this.volume; }, function () { return audio.volume = _this.volume; });
                // MediaSession:
                // This is a new browser API being adopted on some mobile platforms (at the time of this writing, Android), 
                // which shows media information above the 
                // For more info, see https://developers.google.com/web/updates/2017/02/media-session#set_metadata
                if ('mediaSession' in navigator) {
                    // Setup media session handlers so that a native play/pause/next buttons do the same thing as our footer's play/pause/next.
                    this.setupMediaSessionHandlers();
                    // Listen for when the song changes so that we show the song info on the phone lock screen.
                    this.audioPlayer.song.subscribe(function (songOrNull) { return _this.updateMediaSession(songOrNull); });
                }
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
                    var currentSong = this.audioPlayer.song.getValue();
                    if (currentSong && currentSong.songLike !== Chavah.SongLike.Disliked) {
                        currentSong.songLike = Chavah.SongLike.Disliked;
                        this.likeApi.dislikeSong(currentSong.id)
                            .then(function (rank) { return currentSong.communityRank = rank; });
                        this.songBatch.playNext();
                    }
                }
            };
            FooterController.prototype.likeSong = function () {
                if (this.requireSignIn()) {
                    var currentSong = this.audioPlayer.song.getValue();
                    if (currentSong && currentSong.songLike !== Chavah.SongLike.Liked) {
                        currentSong.songLike = Chavah.SongLike.Liked;
                        this.likeApi.likeSong(currentSong.id)
                            .then(function (rank) { return currentSong.communityRank = rank; });
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
                else {
                    this.songBatch.playNext();
                }
            };
            FooterController.prototype.audioStatusChanged = function (status) {
                if (status === Chavah.AudioStatus.Ended) {
                    this.playNextSong();
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
            FooterController.prototype.setupMediaSessionHandlers = function () {
                var _this = this;
                try {
                    var mediaSession = navigator["mediaSession"];
                    mediaSession.setActionHandler("play", function () { return _this.playPause(); });
                    mediaSession.setActionHandler("pause", function () { return _this.playPause(); });
                    mediaSession.setActionHandler("nexttrack", function () { return _this.playNextSong(); });
                }
                catch (error) {
                    // Can't setup media session action handlers? No worries. Continue as normal.
                }
            };
            FooterController.prototype.updateMediaSession = function (song) {
                if (song) {
                    var metadata = {
                        album: song.album,
                        artist: song.artist,
                        title: song.name,
                        artwork: [
                            { src: song.albumArtUri, sizes: "300x300", type: "image/jpg" }
                        ]
                    };
                    try {
                        navigator["mediaSession"].metadata = new window["MediaMetadata"](metadata);
                    }
                    catch (error) {
                        // Can't update the media session? No worries; eat the error and proceed as normal.
                    }
                }
            };
            return FooterController;
        }());
        FooterController.$inject = [
            "audioPlayer",
            "songBatch",
            "likeApi",
            "songRequestApi",
            "accountApi",
            "stationIdentifier",
            "appNav",
            "$scope"
        ];
        Chavah.FooterController = FooterController;
        Chavah.App.controller("FooterController", FooterController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
