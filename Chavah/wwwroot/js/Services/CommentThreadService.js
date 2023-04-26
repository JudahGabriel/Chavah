var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var CommentThreadService = /** @class */ (function () {
            function CommentThreadService(httpApi) {
                this.httpApi = httpApi;
            }
            CommentThreadService.prototype.get = function (id) {
                var args = {
                    id: id
                };
                return this.httpApi.query("/api/commentThreads/get", args);
            };
            CommentThreadService.prototype.addComment = function (comment, songId) {
                var args = {
                    content: comment,
                    songId: songId
                };
                return this.httpApi.post("/api/commentThreads/addComment", args);
            };
            CommentThreadService.$inject = ["httpApi"];
            return CommentThreadService;
        }());
        Chavah.CommentThreadService = CommentThreadService;
        Chavah.App.service("commentThreadApi", CommentThreadService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=CommentThreadService.js.map