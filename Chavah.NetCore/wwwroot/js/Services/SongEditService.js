var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongEditService = /** @class */ (function () {
            function SongEditService(httpApi) {
                this.httpApi = httpApi;
            }
            SongEditService.prototype.getSongEdit = function (songId) {
                var args = {
                    songId: songId
                };
                return this.httpApi.query("/api/songEdits/get", args);
            };
            SongEditService.prototype.submit = function (song) {
                return this.httpApi.post("/api/songEdits/editSong", song);
            };
            SongEditService.prototype.getPendingEdits = function (take) {
                var args = {
                    take: take,
                };
                return this.httpApi.query("/api/songEdits/getPendingEdits", args);
            };
            SongEditService.prototype.approve = function (songEdit) {
                return this.httpApi.post("/api/songEdits/approve", songEdit);
            };
            SongEditService.prototype.reject = function (songEditId) {
                var args = {
                    songEditId: songEditId,
                };
                return this.httpApi.postUriEncoded("/api/songEdits/reject", args);
            };
            SongEditService.$inject = [
                "httpApi",
            ];
            return SongEditService;
        }());
        Chavah.SongEditService = SongEditService;
        Chavah.App.service("songEditApi", SongEditService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SongEditService.js.map