namespace BitShuva.Chavah {
    export class RequestSongController {

        selectedSongRequest: Song | null;
        songRequestText = "";
        readonly songRequestResultView: string;
        isLoading = false;

        static $inject = [
            "songApi",
            "templatePaths",
            "$uibModalInstance",
            "$q",
        ];

        constructor(
            private songApi: SongApiService,
            private templatePaths: ITemplatePaths,
            private $uibModalInstance: ng.ui.bootstrap.IModalServiceInstance,
            private $q: ng.IQService) {

            this.songRequestResultView = templatePaths.songRequestResult;
        }

        getSongMatches(searchText: string): ng.IPromise<Song[]> {
            const maxSongResults = 10;
            const deferred = this.$q.defer<Song[]>();
            this.isLoading = true;
            this.songApi.getSongMatches(searchText)
                .then(results => deferred.resolve(results.slice(0, maxSongResults)))
                .catch(error => deferred.reject(error))
                .finally(() => {
                    const isWaitingOnResults = searchText === this.songRequestText;
                    if (isWaitingOnResults) {
                        this.isLoading = false;
                    }
                });
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
