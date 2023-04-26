var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ConfirmDeleteSongController = /** @class */ (function () {
            function ConfirmDeleteSongController(song, songApi, $uibModalInstance) {
                this.song = song;
                this.songApi = songApi;
                this.$uibModalInstance = $uibModalInstance;
                this.saving = false;
            }
            ConfirmDeleteSongController.prototype.close = function () {
                this.$uibModalInstance.close(false);
            };
            ConfirmDeleteSongController.prototype.deleteSong = function () {
                var _this = this;
                if (!this.saving) {
                    this.saving = true;
                    this.songApi.deleteSong(this.song)
                        .then(function () { return _this.$uibModalInstance.close(true); })
                        .finally(function () { return _this.saving = false; });
                }
            };
            ConfirmDeleteSongController.$inject = [
                "song",
                "songApi",
                "$uibModalInstance"
            ];
            return ConfirmDeleteSongController;
        }());
        Chavah.ConfirmDeleteSongController = ConfirmDeleteSongController;
        Chavah.App.controller("ConfirmDeleteSongController", ConfirmDeleteSongController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=ConfirmDeleteSongController.js.map