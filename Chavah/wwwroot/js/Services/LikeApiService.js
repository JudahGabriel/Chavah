var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LikeApiService = /** @class */ (function () {
            function LikeApiService(httpApi) {
                this.httpApi = httpApi;
            }
            LikeApiService.prototype.dislikeSong = function (songId) {
                return this.httpApi.postUriEncoded("/api/likes/dislike", { songId: songId });
            };
            LikeApiService.prototype.likeSong = function (songId) {
                return this.httpApi.postUriEncoded("/api/likes/like", { songId: songId });
            };
            LikeApiService.prototype.setSongAsUnranked = function (songId) {
                var args = {
                    songId: songId
                };
                return this.httpApi.postUriEncoded("/api/likes/setAsUnranked", args);
            };
            LikeApiService.$inject = ["httpApi"];
            return LikeApiService;
        }());
        Chavah.LikeApiService = LikeApiService;
        Chavah.App.service("likeApi", LikeApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=LikeApiService.js.map