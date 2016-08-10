namespace BitShuva.Chavah {
    export class HeaderController {

        volumeShown = false;
        currentRoute = HeaderRoute.NowPlaying;

        static $inject = [
            "audioPlayer",
            "signInService",
            "songRequestApi",
            "stationIdentifier",
            "songBatch",
            "$scope",
            "$rootScope",
            "$location"
        ];

        constructor(
            private audioPlayer: AudioPlayerService,
            private signInService: SignInService,
            private songRequestApi: SongRequestApiService,
            private stationIdentifier: StationIdentifierService,
            private songBatch: SongBatchService,
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService,
            private $location: ng.ILocationService) {

            var audio = <HTMLAudioElement>document.querySelector("audio");
            this.audioPlayer.initialize(audio);
            this.playNextSong();

            this.audioPlayer.status
                .debounce(100)
                .subscribe(() => $scope.$applyAsync()); // Notify the scope when the audio status changes.

            // When the route changes, highlight the correct nav bar tab.
            this.$rootScope.$on("$locationChangeStart", () => this.routeChanged());
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
            if (this.signInService.isSignedIn()) {
                this.songRequestApi.showSongRequestDialog()
                    .result.then((songOrNull: Song) => this.songRequestDialogCompleted(songOrNull));
            } else {
                this.signInService.promptForSignIn();
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

        private routeChanged() {
            var path = this.$location.path();
            if (path) {
                if (path.indexOf("/nowplaying") >= 0) {
                    this.currentRoute = HeaderRoute.NowPlaying;
                } else if (path.indexOf("/trending") >= 0) {
                    this.currentRoute = HeaderRoute.Trending;
                } else if (path.indexOf("/top") >= 0) {
                    this.currentRoute = HeaderRoute.Top;
                } else if (path.indexOf("/likes") >= 0) {
                    this.currentRoute = HeaderRoute.Likes;
                } else {
                    this.currentRoute = HeaderRoute.Other;
                }
            }
        }

        private songRequestDialogCompleted(songOrNull: Song) {
            if (songOrNull) {
                this.audioPlayer.pause();

                this.songRequestApi.requestSong(songOrNull)
                    .then(() => this.playNextSong());
            }
        }
    }

    App.controller("HeaderController", HeaderController);
}