namespace BitShuva.Chavah {
    export class FooterController {
        
        volumeShown = false;
        volumeVal = new Rx.Subject<number>();
        isBuffering = false;
        lastAudioErrorTime: Date | null = null;
        audio: HTMLAudioElement | null = null;
        isShowingAudioError = false;
        wakeLock: Object | null = null;
        isThumbingUpOrDown = false;

        static $inject = [
            "audioPlayer",
            "songBatch",
            "likeApi",
            "songRequestApi",
            "accountApi",
            "userApi",
            "songApi",
            "stationIdentifier",
            "adAnnouncer",
            "newMusicAnnouncer",
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
            private songApi: SongApiService,
            private stationIdentifier: StationIdentifierService,
            private adAnnouncer: AdAnnouncerService,
            private newMusicAnnouncer: NewMusicAnnouncerService,
            private appNav: AppNavService,
            private $scope: ng.IScope) {

            // Notify the scope when the audio status changes.
            this.audioPlayer.status
                .debounce(1000)
                .subscribe(status => this.audioStatusChanged(status));

            // If we've been stalled for a long time, show an error.
            this.audioPlayer.status
                .debounce(20000)
                .where(s => s === AudioStatus.Stalled)
                .subscribe(() => this.showAudioErrorNotification(this.createAudioErrorInfo("Audio stalled for more than 20 seconds")));

            // If the audio is aborted and not recovered after 3 seconds, show an error.
            this.audioPlayer.status
                .debounce(3000)
                .where(s => s === AudioStatus.Aborted)
                .subscribe(status => {
                    this.showAudioErrorNotification(this.createAudioErrorInfo(`Audio aborted for more than 3 seconds`));
                });

            // If an audio error occurred and it doesn't recover after 5 seconds, show an error.
            this.audioPlayer.error
                .debounce(5000)
                .where(error => error.songId === this.audioPlayer.song.getValue()?.id && this.audioPlayer.status.getValue() === AudioStatus.Erred)
                .where(error => !error.mp3Url || !error.mp3Url.toLowerCase().includes("soundeffects")) // sound effect errors are handled after this.
                .subscribe(error => this.showAudioErrorNotification(error));

            // If a sound effect error occurs, just skip to the next song.
            this.audioPlayer.error
                .debounce(1000)
                .where(error => !!error.mp3Url && error.mp3Url.toLowerCase().includes("soundeffects"))
                .subscribe(error => this.playNextSong());

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
                return "You have already liked this song. Chavah is playing it more often. Tap to undo your like.";
            }
            return "Like this song. Chavah will play this song, and others like it, more often.";
        }

        get dislikeText(): string {
            if (this.dislikesCurrentSong) {
                return "You have already disliked this song. Chavah is playing it less often. Tap to undo your dislike.";
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
            return this.audioPlayer.volume;
        }

        set volume(val: number) {
            if (isNaN(val)) {
                val = 1.0;
            }

            this.audioPlayer.volume = val;
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

            this.tryAcquireWakeLock();
        }

        // Wake lock will prevent the screen from turning off while Chavah is running.
        // We do this because some devices, especially mobile devices, will suspend
        // JS execution when the screen turns off, thus stopping Chavah from playing the next song.
        async tryAcquireWakeLock() {
            if ('wakeLock' in navigator) {
                // If this is our first time acquiring the wake lock, listen for page visibility changed.
                // Wake locks get released automatically when the page isn't in view.
                // Reacquire it when the page is back in view.
                const isFirstTime = !this.wakeLock;
                if (isFirstTime) {
                    document.addEventListener("visibilitychange", () => {
                        if (this.wakeLock && document.visibilityState === "visible") {
                            this.tryAcquireWakeLock();
                        }
                    });
                }

                const wakeLock: any = navigator["wakeLock"];
                try {
                    this.wakeLock = await wakeLock.request("screen");
                } catch (wakeLockError) {
                    console.warn("Unable to acquire wake lock.", wakeLockError);
                }
            }
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

        thumbDownClicked() {
            if (this.ensureSignedIn()) {
                const currentSong = this.audioPlayer.song.getValue();
                if (currentSong) {
                    // If we haven't disliked the song, dislike it.
                    if (currentSong.songLike !== SongLike.Disliked) {
                        this.dislikeSong(currentSong);
                        this.songBatch.playNext();
                    } else {
                        // Otherwise, set as unranked.
                        this.setSongAsUnranked(currentSong);
                    }
                }
            }
        }

        thumbUpClicked() {
            if (this.ensureSignedIn()) {
                const currentSong = this.audioPlayer.song.getValue();
                if (currentSong) {
                    // If we haven't liked the song, like it.
                    if (currentSong.songLike !== SongLike.Liked) {
                        this.likeSong(currentSong);
                    } else {
                        this.setSongAsUnranked(currentSong);
                    }
                }
            }
        }

        setSongAsUnranked(song: Song): ng.IPromise<number> {
            // Undo our existing like.
            song.songLike = SongLike.Unranked;
            this.isThumbingUpOrDown = true;
            return this.likeApi.setSongAsUnranked(song.id)
                .then(songRank => song.communityRank = songRank)
                .finally(() => this.isThumbingUpOrDown = false);
        }

        likeSong(song: Song) {
            song.songLike = SongLike.Liked;
            this.isThumbingUpOrDown = true;
            this.likeApi.likeSong(song.id)
                .then(rank => song.communityRank = rank)
                .finally(() => this.isThumbingUpOrDown = false);
        }

        dislikeSong(song: Song) {
            song.songLike = SongLike.Disliked;
            this.isThumbingUpOrDown = true;
            this.likeApi.dislikeSong(song.id)
                .then(rank => song.communityRank = rank)
                .finally(() => this.isThumbingUpOrDown = false);
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
            const pendingNewMusicAnnouncement = this.newMusicAnnouncer.getPendingNewMusicAnnouncement();
            if (this.songRequestApi.hasPendingRequest()) {
                this.songRequestApi.playRequest();
            } else if (this.stationIdentifier.hasPendingAnnouncement()) {
                // Play the station identifier if need be.
                this.stationIdentifier.playStationIdAnnouncement();
            } else if (this.adAnnouncer.hasPendingAnnouncement()) {
                this.adAnnouncer.playAdAnnouncement();
            } else if (pendingNewMusicAnnouncement) {
                this.newMusicAnnouncer.play(pendingNewMusicAnnouncement);
            }
            else {
                this.songBatch.playNext();
            }
        }

        audioStatusChanged(status: AudioStatus) {
            if (status === AudioStatus.Ended) {
                this.playNextSong();
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
            const isShowingVolumeUi = matchMedia("(min-width: 768px)").matches;
            if (this.accountApi.currentUser && isShowingVolumeUi) {
                // Only do this if we're not on mobile. Mobile doesn't have volume UI controls shown; they can just set their phone volume.
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

        private showAudioErrorNotification(errorInfo: IAudioErrorInfo) {
            // Make sure we should show the error.
            const currentSong = this.audioPlayer.song.getValue();
            const isErrorForCurrentSong = !currentSong || !errorInfo.songId || currentSong.id === errorInfo.songId;
            const isErrorForAnnouncement = errorInfo.mp3Url && (errorInfo.mp3Url.toLowerCase().includes("soundeffects") || errorInfo.mp3Url.toLowerCase().includes("/api/cdn/"));
            const isSongPlaying = this.audioPlayer.status.getValue() === AudioStatus.Playing;
            const shouldShowError = isErrorForCurrentSong && !isSongPlaying && !isErrorForAnnouncement;
            if (shouldShowError) {
                this.songApi.songFailed(errorInfo);
                console.error("Error playing audio", errorInfo);
                this.isShowingAudioError = true;
                this.appNav.showErrorPlayingAudio(errorInfo, this.audioPlayer.song.getValue())
                    .closed.finally(() => this.isShowingAudioError = false);
            } else if (!isSongPlaying && isErrorForAnnouncement) {
                // Is it an error for an announcement? Just play next song.
                this.playNextSong();
            }
        }

        private createAudioErrorInfo(message: string): IAudioErrorInfo {
            return {
                errorMessage: message,
                mp3Url: this.audio?.src || null,
                songId: this.audioPlayer.song.getValue()?.id || null,
                trackPosition: this.audio?.currentTime || null
            };
        }
    }

    App.controller("FooterController", FooterController);
}
