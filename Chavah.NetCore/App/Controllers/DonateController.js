var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var DonateController = (function () {
            function DonateController(artistApi, $routeParams) {
                var _this = this;
                this.desiredArtistName = null;
                this.donationTargetOptions = [
                    "Chavah Messianic Radio",
                    "All artists on Chavah Messianic Radio"
                ];
                this.donationTarget = this.donationTargetOptions[0];
                this.selectedArtist = null;
                this.desiredArtistName = $routeParams["artist"];
                if (this.desiredArtistName) {
                    this.donationTargetOptions.push(this.desiredArtistName);
                    this.donationTarget = this.desiredArtistName;
                }
                artistApi.getAll("", 0, 1000)
                    .then(function (results) { return _this.allArtistsFetched(results.items); });
            }
            DonateController.prototype.allArtistsFetched = function (artists) {
                var artistNames = artists.map(function (a) { return a.name; });
                (_a = this.donationTargetOptions).push.apply(_a, artistNames);
                var _a;
            };
            return DonateController;
        }());
        DonateController.$inject = [
            "artistApi",
            "$routeParams"
        ];
        Chavah.DonateController = DonateController;
        Chavah.App.controller("DonateController", DonateController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
