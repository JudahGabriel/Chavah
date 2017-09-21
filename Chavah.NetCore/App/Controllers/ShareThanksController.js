var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ShareThanksController = (function () {
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
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ShareThanksController.prototype, "donateText", {
                get: function () {
                    if (this.artist) {
                        return "Donate to " + this.artist;
                    }
                    return "Donate to the artists";
                },
                enumerable: true,
                configurable: true
            });
            return ShareThanksController;
        }());
        ShareThanksController.$inject = [
            "$routeParams"
        ];
        Chavah.ShareThanksController = ShareThanksController;
        Chavah.App.controller("ShareThanksController", ShareThanksController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
