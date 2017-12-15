var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var RequestSongController = /** @class */ (function () {
            function RequestSongController(songApi, templatePaths, $uibModalInstance, $q) {
                this.songApi = songApi;
                this.templatePaths = templatePaths;
                this.$uibModalInstance = $uibModalInstance;
                this.$q = $q;
                this.songRequestText = "";
                this.songRequestResultView = templatePaths.songRequestResult;
            }
            RequestSongController.prototype.getSongMatches = function (searchText) {
                var maxSongResults = 10;
                var deferred = this.$q.defer();
                this.songApi.getSongMatches(searchText)
                    .then(function (results) { return deferred.resolve(results.slice(0, maxSongResults)); })
                    .catch(function (error) { return deferred.reject(error); });
                return deferred.promise;
            };
            RequestSongController.prototype.songChosen = function (song) {
                this.selectedSongRequest = song;
            };
            RequestSongController.prototype.requestSelectedSong = function () {
                if (this.selectedSongRequest) {
                    this.$uibModalInstance.close(this.selectedSongRequest);
                }
            };
            RequestSongController.prototype.close = function () {
                this.$uibModalInstance.close(null);
            };
            RequestSongController.$inject = [
                "songApi",
                "templatePaths",
                "$uibModalInstance",
                "$q",
            ];
            return RequestSongController;
        }());
        Chavah.RequestSongController = RequestSongController;
        Chavah.App.controller("RequestSongController", RequestSongController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=RequestSongController.js.map