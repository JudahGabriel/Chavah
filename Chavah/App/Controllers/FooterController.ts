namespace BitShuva.Chavah {
    export class FooterController {

        volumeShown = false;

        static $inject = [
            "audioPlayer",
            "songBatch",
            "songRequestApi",
            "signInApi",
            "stationIdentifier",
            "appNav",
            "$scope"
        ];

        constructor(
            private audioPlayer: AudioPlayerService,
            private songBatch: SongBatchService,
            private songRequestApi: SongRequestApiService,
            private signInApi: SignInService,
            private stationIdentifier: StationIdentifierService,
            private appNav: AppNavService,
            $scope: ng.IScope) {

            var audio = <HTMLAudioElement>document.querySelector("audio");
            this.audioPlayer.initialize(audio);
            this.playNextSong();

            this.audioPlayer.status
                .debounce(100)
                .subscribe(() => $scope.$applyAsync()); // Notify the scope when the audio status changes.
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

        requestSong() {
            if (this.signInApi.isSignedIn) {
                this.appNav.showSongRequestDialog()
                    .result.then((songOrNull: Song) => this.songRequestDialogCompleted(songOrNull));
            } else {
                this.appNav.signIn();
            }
        }

        private songRequestDialogCompleted(songOrNull: Song) {
            if (songOrNull) {
                this.audioPlayer.pause();

                this.songRequestApi.requestSong(songOrNull)
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
    }

    App.controller("FooterController", FooterController);
}