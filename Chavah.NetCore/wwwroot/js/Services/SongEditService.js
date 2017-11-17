var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongEditService = (function () {
            function SongEditService(httpApi) {
                this.httpApi = httpApi;
            }
            SongEditService.prototype.submit = function (song) {
                return this.httpApi.post("/api/songEdits/editSong", song);
            };
            SongEditService.prototype.getPendingEdits = function (take) {
                var args = {
                    take: take
                };
                return this.httpApi.query("/api/songEdits/getPendingEdits", args);
            };
            SongEditService.prototype.approve = function (songEdit) {
                return this.httpApi.post("/api/songEdits/approve", songEdit);
            };
            SongEditService.prototype.reject = function (songEditId) {
                var args = {
                    songEditId: songEditId
                };
                return this.httpApi.postUriEncoded("/api/songEdits/reject", args);
            };
            return SongEditService;
        }());
        SongEditService.$inject = [
            "httpApi"
        ];
        Chavah.SongEditService = SongEditService;
        Chavah.App.service("songEditApi", SongEditService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
