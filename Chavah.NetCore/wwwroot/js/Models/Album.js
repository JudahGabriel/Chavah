var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var Album = (function () {
            function Album(serverObj) {
                this.isSaving = false;
                angular.merge(this, serverObj);
            }
            return Album;
        }());
        Chavah.Album = Album;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
