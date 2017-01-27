namespace BitShuva.Chavah {
    export class FooterController {

        volumeShown = false;
        volume = 1;

        static $inject = [
            "audioPlayer",
            "songBatch",
            "likeApi",
            "songRequestApi",
            "accountApi",
            "stationIdentifier",
            "appNav",
            "$scope"
        ];

        constructor(
            private audioPlayer: AudioPlayerService,
            private songBatch: SongBatchService,
            private likeApi: LikeApiService,
            private songRequestApi: SongRequestApiService,
            private accountApi: AccountService,
            private stationIdentifier: StationIdentifierService,
            private appNav: AppNavService,
            private $scope: ng.IScope) {

            var audio = document.querySelector("#audio") as HTMLVideoElement;
            this.audioPlayer.initialize(audio);
            this.volume = audio.volume;

            this.audioPlayer.status
                .debounce(100)
                .subscribe(status => this.audioStatusChanged(status)); // Notify the scope when the audio status changes.

            // Update the track time. We don't use angular for this, because of the constant (per second) update.
            this.audioPlayer.playedTimeText
                .distinctUntilChanged()
                .subscribe(result => $(".footer .track-time").text(result));
            this.audioPlayer.duration
                .distinctUntilChanged()
                .subscribe(result => $(".footer .track-duration").text(this.getFormattedTime(result)));            
            this.audioPlayer.status
                .distinctUntilChanged()
                .subscribe(status => $(".footer .audio-status").text(this.getAudioStatusText(status)));
            this.audioPlayer.playedTimePercentage
                .distinctUntilChanged()
                .subscribe(percent => $(".footer .trackbar").width(percent + "%"));

            $scope.$watch(() => this.volume, () => audio.volume = this.volume);
        }

        get likesCurrentSong(): boolean {
            var currentSong = this.audioPlayer.song.getValue();
            if (currentSong) {
                return currentSong.songLike === SongLike.Liked;
            }

            return false;
        }

        get dislikesCurrentSong(): boolean {
            var currentSong = this.audioPlayer.song.getValue();
            if (currentSong) {
                return currentSong.songLike === SongLike.Disliked;
            }

            return false;
        }

        get likeText(): string {
            if (this.likesCurrentSong) {
                return "You have already liked this song. Chavah is playing it more often."
            }
            return "Like this song. Chavah will play this song, and others like it, more often.";
        }

        get dislikeText(): string {
            if (this.dislikesCurrentSong) {
                return "You have already disliked this song. Chavah is playing it less often."
            }
            return "Dislike this song. Chavah will play this song, and others like it, less often.";
        }

        get volumeIconClass(): string {
            if (this.volume > .95) {
                return "fa-volume-up";
            } 
            if (this.volume < .05) {
                return "fa-volume-off";
            }

            return "fa-volume-down";
        }

        toggleVolumnShown() {
            this.volumeShown = !this.volumeShown;
        }

        isPaused(): boolean {
            return this.audioPlayer.status.getValue() === AudioStatus.Paused;
        }

        playPause() {
            if (this.audioPlayer.status.getValue() === AudioStatus.Playing) {
                this.audioPlayer.pause();
            } else {
                this.audioPlayer.resume();
            }
        }

        dislikeSong() {
            if (this.requireSignIn()) {
                var currentSong = this.audioPlayer.song.getValue();
                if (currentSong && currentSong.songLike !== SongLike.Disliked) {
                    currentSong.songLike = SongLike.Disliked;
                    this.likeApi.dislikeSong(currentSong.id)
                        .then(rank => currentSong!.communityRank = rank);
                    this.songBatch.playNext();
                }
            }
        }

        likeSong() {
            if (this.requireSignIn()) {
                var currentSong = this.audioPlayer.song.getValue();
                if (currentSong && currentSong.songLike !== SongLike.Liked) {
                    currentSong.songLike = SongLike.Liked;
                    this.likeApi.likeSong(currentSong.id)
                        .then(rank => currentSong!.communityRank = rank);
                }
            }
        }

        requestSong() {
            if (this.requireSignIn()) {
                this.appNav.showSongRequestDialog()
                    .result.then((song: Song | null) => this.songRequestDialogCompleted(song));
            }
        }

        requireSignIn(): boolean {
            if (this.accountApi.isSignedIn) {
                return true;
            } else {
                this.appNav.promptSignIn();
                return false;
            }
        }

        songRequestDialogCompleted(song: Song | null) {
            if (song) {
                this.audioPlayer.pause();
                this.songRequestApi.requestSong(song)
                    .then(() => this.playNextSong());
            }
        }

        playNextSong() {
            this.audioPlayer.pause();

            // If we've got a song request, play that.
            if (this.songRequestApi.hasPendingRequest()) {
                this.songRequestApi.playRequest();
            } else if (this.stationIdentifier.hasPendingAnnouncement()) {
                // Play the station identifier if need be.
                this.stationIdentifier.playStationIdAnnouncement();
            } else {
                this.songBatch.playNext();
            }
        }

        audioStatusChanged(status: AudioStatus) {
            if (status === AudioStatus.Ended) {
                this.playNextSong();
            }

            this.$scope.$applyAsync();
        }

        getFormattedTime(totalSeconds: number): string {
            var minutes = Math.floor(totalSeconds / 60);
            var seconds = Math.floor(totalSeconds - (minutes * 60));
            var zeroPaddedSeconds = seconds < 10 ? "0" : "";
            return `${minutes}:${zeroPaddedSeconds}${seconds}`;
        }

        getAudioStatusText(status: AudioStatus): string {
            switch (status) {
                case AudioStatus.Aborted: return "Unable to play";
                case AudioStatus.Buffering: return "Buffering...";
                case AudioStatus.Ended: return "Ended...";
                case AudioStatus.Erred: return "Encountered an error";
                case AudioStatus.Paused: return "Paused";
                case AudioStatus.Playing: return "";
                case AudioStatus.Stalled: return "Stalled...";
            }
        }
    }

    App.controller("FooterController", FooterController);
}