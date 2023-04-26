var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var PopularController = /** @class */ (function () {
            function PopularController(songApi, appNav) {
                var _this = this;
                this.songApi = songApi;
                this.appNav = appNav;
                this.songsList = new Chavah.PagedList(function (skip, take) { return _this.songApi.getPopular(skip, take); });
            }
            PopularController.prototype.$onInit = function () {
                this.songsList.take = 25;
                this.songsList.fetchNextChunk();
            };
            PopularController.$inject = [
                "songApi",
                "appNav",
            ];
            return PopularController;
        }());
        Chavah.PopularController = PopularController;
        Chavah.App.controller("PopularController", PopularController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=PopularController.js.map