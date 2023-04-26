var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var RecentController = /** @class */ (function () {
            function RecentController(songApi, $q, appNav) {
                var _this = this;
                this.songApi = songApi;
                this.$q = $q;
                this.appNav = appNav;
                this.songsList = new Chavah.PagedList(function (skip, take) { return _this.getRecentSongsAsPagedList(skip, take); });
            }
            RecentController.prototype.$onInit = function () {
                this.songsList.take = 25;
                this.songsList.fetchNextChunk();
            };
            RecentController.prototype.getRecentSongsAsPagedList = function (skip, take) {
                // Getting recent songs returns a plain array, because we only
                // keep 10 or song recent songs for each user.
                // Since it's not actually a paged list, we convert
                // the list of songs to a paged list here.
                var deferred = this.$q.defer();
                this.songApi.getRecentPlays(this.songsList.take)
                    .then(function (results) {
                    var pagedResults = {
                        items: results,
                        skip: skip,
                        take: take,
                        total: results.length
                    };
                    deferred.resolve(pagedResults);
                });
                return deferred.promise;
            };
            RecentController.$inject = [
                "songApi",
                "$q",
                "appNav"
            ];
            return RecentController;
        }());
        Chavah.RecentController = RecentController;
        Chavah.App.controller("RecentController", RecentController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=RecentController.js.map