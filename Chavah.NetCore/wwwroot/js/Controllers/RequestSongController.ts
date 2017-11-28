namespace BitShuva.Chavah {
    export class RequestSongController {
        selectedSongRequest: Song | null;
        songRequestText = "";
        readonly songRequestResultView: string;

        static $inject = [
            "songApi",
            "templatePaths",
            "$uibModalInstance",
            "$q"
        ];

        constructor(
            private songApi: SongApiService,
            private templatePaths: TemplatePaths,
            private $uibModalInstance: ng.ui.bootstrap.IModalServiceInstance,
            private $q: ng.IQService) {

            this.songRequestResultView = templatePaths.songRequestResult;
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

    App.controller("RequestSongController", RequestSongController);
}