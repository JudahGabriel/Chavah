﻿namespace BitShuva.Chavah {
    export class FooterController {
        
        volumeShown = false;
        volumeVal = new Rx.Subject<number>();
        isBuffering = false;
        lastAudioErrorTime: Date | null = null;
        stalledTimerHandle: number | null = null;
        audio: HTMLAudioElement | null = null;
        isShowingAudioError = false;

        static $inject = [
            "audioPlayer",
            "songBatch",
            "likeApi",
            "songRequestApi",
            "accountApi",
            "userApi",
            "stationIdentifier",
            "adAnnouncer",
            "appNav",
            "$scope"
        ];

        constructor(
            private audioPlayer: AudioPlayerService,
            private songBatch: SongBatchService,
            private likeApi: LikeApiService,
            private songRequestApi: SongRequestApiService,
            private accountApi: AccountService,
            private userApi: UserApiService,
            private stationIdentifier: StationIdentifierService,
            private adAnnouncer: AdAnnouncerService,
            private appNav: AppNavService,
            private $scope: ng.IScope) {

            // Notify the scope when the audio status changes.
            this.audioPlayer.status
                .debounce(1000)
                .subscribe(status => this.audioStatusChanged(status));

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
            this.audioPlayer.error
                .debounce(2000)
                .where(val => this.shouldShowErrorNotification(val))
                .subscribe(audioError => this.showAudioErrorNotification(audioError));
                        
            // If we sign in, restore the volume preference for the user.
            this.accountApi.signedInState
                .distinctUntilChanged()
                .where(isSignedIn => isSignedIn)
                .subscribe(_ => this.restoreVolumeFromSignedInUser());
        }

        get likesCurrentSong(): boolean {
            let currentSong = this.audioPlayer.song.getValue();
            if (currentSong) {
                return currentSong.songLike === SongLike.Liked;
            }

            return false;
        }

        get dislikesCurrentSong(): boolean {
            let currentSong = this.audioPlayer.song.getValue();
            if (currentSong) {
                return currentSong.songLike === SongLike.Disliked;
            }

            return false;
        }

        get likeText(): string {
            if (this.likesCurrentSong) {
                return "You have already liked this song. Chavah is playing it more often.";
            }
            return "Like this song. Chavah will play this song, and others like it, more often.";
        }

        get dislikeText(): string {
            if (this.dislikesCurrentSong) {
                return "You have already disliked this song. Chavah is playing it less often.";
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

        get volume() {
            if (this.audio) {
                return this.audio.volume;
            }

            return 1;
        }

        set volume(val: number) {
            if (isNaN(val)) {
                val = 1.0;
            }
            if (this.audio) {
                this.audio.volume = val;
            }

            this.volumeVal.onNext(val);
        }

        $onInit() {
            this.audio = document.querySelector("#audio") as HTMLVideoElement;
            if (!this.audio) {
                throw new Error("Couldn't locate #audio element");
            }

            this.audioPlayer.initialize(this.audio);
            this.restoreVolumeFromSignedInUser();

            // Wait for changes to the volume level and save them.
            this.volumeVal
                .distinctUntilChanged()
                .debounce(2000)
                .where(v => !!this.accountApi.currentUser && this.accountApi.currentUser.volume !== v)
                .subscribe(val => this.saveVolumePreference(val));
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
            if (this.ensureSignedIn()) {
                let currentSong = this.audioPlayer.song.getValue();
                if (currentSong && currentSong.songLike !== SongLike.Disliked) {
                    currentSong.songLike = SongLike.Disliked;
                    this.likeApi.dislikeSong(currentSong.id)
                        .then(rank => currentSong!.communityRank = rank);
                    this.songBatch.playNext();
                }
            }
        }

        likeSong() {
            if (this.ensureSignedIn()) {
                let currentSong = this.audioPlayer.song.getValue();
                if (currentSong && currentSong.songLike !== SongLike.Liked) {
                    currentSong.songLike = SongLike.Liked;
                    this.likeApi.likeSong(currentSong.id)
                        .then(rank => currentSong!.communityRank = rank);
                }
            }
        }

        requestSong() {
            if (this.ensureSignedIn()) {
                this.appNav.songRequestModal()
                    .result.then((song: Song | null) => this.songRequestDialogCompleted(song));
            }
        }

        ensureSignedIn(): boolean {
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
            } else if (this.adAnnouncer.hasPendingAnnouncement()) {
                this.adAnnouncer.playAdAnnouncement();
            }else {
                this.songBatch.playNext();
            }
        }

        audioStatusChanged(status: AudioStatus) {
            if (status === AudioStatus.Ended) {
                this.playNextSong();
            }

            if (status === AudioStatus.Erred) {
                // If it's been more than 30 seconds since the last error, play the next song.
                // (We don't want to always play the next song, because if we're disconnected, all audio will fail.)
                const minSecondsBetweenErrors = 30;
                const hasBeen30SecSinceLastError = this.lastAudioErrorTime === null || moment().diff(moment(this.lastAudioErrorTime), "seconds") > minSecondsBetweenErrors;
                if (hasBeen30SecSinceLastError) {
                    this.playNextSong();
                }

                this.lastAudioErrorTime = new Date();
            } else if (status === AudioStatus.Stalled) {
                // Sometimes on mobile platforms (especially older Android) we 
                // get into a stalled state and never recover.
                // To rectify this, check if we're still stalled 7 seconds later
                // and if so, play the next song.
                if (this.stalledTimerHandle) {
                    clearTimeout(this.stalledTimerHandle);
                    this.stalledTimerHandle = setTimeout(() => {
                        if (this.audioPlayer.status.getValue() === AudioStatus.Stalled) {
                            this.playNextSong();
                        }
                    }, 5000);
                }
            }

            this.isBuffering = status === AudioStatus.Buffering || status === AudioStatus.Stalled;
            this.$scope.$applyAsync();
        }

        getFormattedTime(totalSeconds: number): string {
            if (isNaN(totalSeconds) || totalSeconds === 0) {
                return "0:00";
            }

            let minutes = Math.floor(totalSeconds / 60);
            let seconds = Math.floor(totalSeconds - (minutes * 60));
            let zeroPaddedSeconds = seconds < 10 ? "0" : "";
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

        restoreVolumeFromSignedInUser() {
            if (this.accountApi.currentUser) {
                // Set the volume to whatever the user last set it.
                // Min value is 0.1, otherwise users may wonder why they don't hear audio
                this.volume = Math.max(0.1, this.accountApi.currentUser.volume);
            }
        }

        saveVolumePreference(volume: number) {
            if (this.accountApi.currentUser && this.accountApi.currentUser.volume !== volume) {
                this.accountApi.currentUser.volume = volume;
                this.userApi.saveVolume(volume);
            }
        }

        shouldShowErrorNotification(errorInfo: IAudioErrorInfo): boolean {
            const currentSong = this.audioPlayer.song.getValue();
            const isErrorForCurrentSong = !currentSong || !errorInfo.songId || currentSong.id === errorInfo.songId;

            // The song may have started playing after the initial error.
            const isSongPlaying = this.audioPlayer.status.getValue() === AudioStatus.Playing;

            return isErrorForCurrentSong && !isSongPlaying;
        }

        private showAudioErrorNotification(errorInfo: IAudioErrorInfo) {
            console.log("Error playing audio", errorInfo);
            this.isShowingAudioError = true;
            this.appNav.showErrorPlayingAudio(errorInfo, this.audioPlayer.song.getValue())
                .closed.finally(() => this.isShowingAudioError = false);
        }
    }

    App.controller("FooterController", FooterController);
}
