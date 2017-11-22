var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LikeApiService = (function () {
            function LikeApiService(httpApi) {
                this.httpApi = httpApi;
            }
            LikeApiService.prototype.dislikeSong = function (songId) {
                var args = {
                    songId: songId
                };
                return this.httpApi.postUriEncoded("/api/likes/dislike", args);
            };
            LikeApiService.prototype.likeSong = function (songId) {
                var args = {
                    songId: songId
                };
                return this.httpApi.postUriEncoded("/api/likes/like", args);
            };
            return LikeApiService;
        }());
        LikeApiService.$inject = ["httpApi"];
        Chavah.LikeApiService = LikeApiService;
        Chavah.App.service("likeApi", LikeApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
