var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongEditApprovedController = (function () {
            function SongEditApprovedController($routeParams) {
                this.artist = $routeParams["artist"];
                this.songName = $routeParams["songName"];
            }
            return SongEditApprovedController;
        }());
        SongEditApprovedController.$inject = [
            "$routeParams"
        ];
        Chavah.SongEditApprovedController = SongEditApprovedController;
        Chavah.App.controller("SongEditApprovedController", SongEditApprovedController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
