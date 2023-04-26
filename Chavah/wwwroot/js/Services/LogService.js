var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LogService = /** @class */ (function () {
            function LogService(httpApi) {
                this.httpApi = httpApi;
            }
            LogService.prototype.getAll = function (skip, take, level, sort) {
                var args = {
                    skip: skip,
                    take: take,
                    level: level,
                    sort: sort
                };
                return this.httpApi.query("/api/logs/getAll", args, LogService.pagedListSelector);
            };
            LogService.prototype.deleteLog = function (id) {
                var args = {
                    id: id,
                };
                return this.httpApi.postUriEncoded("/api/logs/delete", args);
            };
            LogService.pagedListSelector = function (input) {
                return {
                    skip: input.skip,
                    take: input.take,
                    total: input.total,
                    items: input.items.map(function (i) { return new Chavah.StructuredLog(i); })
                };
            };
            LogService.$inject = ["httpApi"];
            return LogService;
        }());
        Chavah.LogService = LogService;
        Chavah.App.service("logApi", LogService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=LogService.js.map