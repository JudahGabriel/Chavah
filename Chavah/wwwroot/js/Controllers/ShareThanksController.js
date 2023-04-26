var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ShareThanksController = /** @class */ (function () {
            function ShareThanksController($routeParams) {
                this.artist = $routeParams["artist"];
            }
            Object.defineProperty(ShareThanksController.prototype, "donateUrl", {
                get: function () {
                    if (this.artist) {
                        return "#/donate/" + encodeURIComponent(this.artist);
                    }
                    return "#/donate";
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(ShareThanksController.prototype, "donateText", {
                get: function () {
                    if (this.artist) {
                        return "Donate to " + this.artist;
                    }
                    return "Donate to the artists";
                },
                enumerable: false,
                configurable: true
            });
            ShareThanksController.$inject = [
                "$routeParams",
            ];
            return ShareThanksController;
        }());
        Chavah.ShareThanksController = ShareThanksController;
        Chavah.App.controller("ShareThanksController", ShareThanksController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=ShareThanksController.js.map