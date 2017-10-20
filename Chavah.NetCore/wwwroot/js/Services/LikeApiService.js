var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LikeApiService = (function () {
            function LikeApiService(httpApi) {
                this.httpApi = httpApi;
            }
            LikeApiService.prototype.dislikeSong = function (songId) {
                return this.httpApi.post("/api/likes/dislike?songId=" + songId, null);
            };
            LikeApiService.prototype.likeSong = function (songId) {
                return this.httpApi.post("/api/likes/like?songId=" + songId, null);
            };
            return LikeApiService;
        }());
        LikeApiService.$inject = ["httpApi"];
        Chavah.LikeApiService = LikeApiService;
        Chavah.App.service("likeApi", LikeApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
