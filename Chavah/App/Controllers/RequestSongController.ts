namespace BitShuva.Chavah {
    export class RequestSongController {
        selectedSongRequest: Song | null;
        songRequestText = "";

        static $inject = [
            "songApi",
            "$uibModalInstance",
            "$q"
        ];

        constructor(
            private songApi: SongApiService,
            private $uibModalInstance: ng.ui.bootstrap.IModalServiceInstance,
            private $q: ng.IQService) {
        }

        getSongMatches(searchText: string): ng.IPromise<Song[]> {
            var maxSongResults = 10;
            var deferred = this.$q.defer<Song[]>();
            this.songApi.getSongMatches(searchText)
                .then(results => deferred.resolve(results.slice(0, maxSongResults)))
                .catch(error => deferred.reject(error));
            return deferred.promise;
        }

        songChosen(song: Song) {
            this.selectedSongRequest = song;
        }

        requestSelectedSong() {
            if (this.selectedSongRequest) {
                this.$uibModalInstance.close(this.selectedSongRequest);
            }
        }

        close() {
            this.$uibModalInstance.close(null);
        }
    }

    App.controller("RequestSongController", RequestSongController as any);
}