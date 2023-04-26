var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongEditApprovedController = /** @class */ (function () {
            function SongEditApprovedController($routeParams) {
                this.artist = $routeParams["artist"];
                this.songName = $routeParams["songName"];
            }
            SongEditApprovedController.$inject = [
                "$routeParams",
            ];
            return SongEditApprovedController;
        }());
        Chavah.SongEditApprovedController = SongEditApprovedController;
        Chavah.App.controller("SongEditApprovedController", SongEditApprovedController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SongEditApprovedController.js.map