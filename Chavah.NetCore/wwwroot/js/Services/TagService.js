var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var TagService = (function () {
            function TagService(httpApi) {
                this.httpApi = httpApi;
            }
            TagService.prototype.getAll = function () {
                return this.httpApi.query("/api/tags/getAll");
            };
            TagService.prototype.renameTag = function (oldTag, newTag) {
                var args = {
                    oldTag: oldTag,
                    newTag: newTag,
                };
                return this.httpApi.postUriEncoded("/api/tags/rename", args);
            };
            TagService.prototype.deleteTag = function (tag) {
                var args = {
                    tag: tag,
                };
                return this.httpApi.postUriEncoded("/api/tags/delete", args);
            };
            TagService.prototype.searchTags = function (search) {
                var args = {
                    search: search,
                };
                return this.httpApi.query("/api/tags/searchTags", args);
            };
            return TagService;
        }());
        TagService.$inject = ["httpApi"];
        Chavah.TagService = TagService;
        Chavah.App.service("tagApi", TagService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=TagService.js.map