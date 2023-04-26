var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var DonateController = /** @class */ (function () {
            function DonateController(artistApi, homeViewModel, $routeParams) {
                var _this = this;
                this.homeViewModel = homeViewModel;
                this.desiredArtistName = null;
                this.selectedArtist = null;
                this.donationTargetOptions = [
                    this.homeViewModel.pageTitle,
                    "All artists on " + this.homeViewModel.pageTitle,
                ];
                this.donationTarget = this.donationTargetOptions[0];
                this.desiredArtistName = $routeParams["artist"];
                if (this.desiredArtistName) {
                    this.donationTargetOptions.push(this.desiredArtistName);
                    this.donationTarget = this.desiredArtistName;
                }
                artistApi.getAll("", 0, 1000)
                    .then(function (results) { return _this.allArtistsFetched(results.items); });
            }
            DonateController.prototype.allArtistsFetched = function (artists) {
                var _a;
                var artistNames = artists.map(function (a) { return a.name; });
                (_a = this.donationTargetOptions).push.apply(_a, artistNames);
            };
            DonateController.$inject = [
                "artistApi",
                "homeViewModel",
                "$routeParams"
            ];
            return DonateController;
        }());
        Chavah.DonateController = DonateController;
        Chavah.App.controller("DonateController", DonateController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=DonateController.js.map