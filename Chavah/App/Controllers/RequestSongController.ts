namespace BitShuva.Chavah {
    export class RequestSongController {
        selectedSongRequest: Song;
        songRequestMatches: Song[] = [];
        songRequestText = "";

        static $inject = [
            "songApi",
            "$modalInstance",
            "$scope"
        ];

        constructor(
            private songApi: SongApiService,
            private $modalInstance: ng.ui.bootstrap.IModalServiceInstance,
            $scope: ng.IScope) {

            $scope.$watch(() => this.songRequestText, newVal => this.getSongMatches(newVal));
        }

        getSongMatches(searchText: string) {
            if (searchText && searchText.length > 2) {
                this.songApi.getSongMatches(searchText)
                    .then(songs => {
                        var isWaitingOnThisQuery = this.songRequestText === searchText;
                        if (isWaitingOnThisQuery) {
                            this.songRequestMatches = songs;
                        }
                    });
            }
        }

        requestSelectedSong() {
            var selectedSong = this.selectedSongRequest;
            this.$modalInstance.close(selectedSong);
        }

        songRequestMatchClicked(song: Song) {
            this.selectedSongRequest = song;
            this.songRequestText = `${song.artist} - ${song.name}`;
            this.songRequestMatches.length = 0;
        }

        resetSelectedSongRequest() {
            this.selectedSongRequest = null;
        }

        close() {
            this.$modalInstance.close();
        }
    }

    App.controller("RequestSongController", RequestSongController);
}