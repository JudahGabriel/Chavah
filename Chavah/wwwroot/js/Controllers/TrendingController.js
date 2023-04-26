var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var TrendingController = /** @class */ (function () {
            function TrendingController(songApi, appNav) {
                var _this = this;
                this.songApi = songApi;
                this.appNav = appNav;
                this.songsList = new Chavah.PagedList(function (skip, take) { return _this.songApi.getTrendingSongs(skip, take); });
            }
            TrendingController.prototype.$onInit = function () {
                this.songsList.take = 25;
                this.songsList.fetchNextChunk();
            };
            TrendingController.$inject = [
                "songApi",
                "appNav"
            ];
            return TrendingController;
        }());
        Chavah.TrendingController = TrendingController;
        Chavah.App.controller("TrendingController", TrendingController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=TrendingController.js.map