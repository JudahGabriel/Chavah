var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LogService = (function () {
            function LogService(httpApi) {
                this.httpApi = httpApi;
            }
            LogService.prototype.getAll = function (skip, take) {
                var args = {
                    skip: skip,
                    take: take,
                };
                return this.httpApi.query("/api/logs/getAll", args);
            };
            LogService.prototype.deleteLog = function (id) {
                var args = {
                    id: id,
                };
                return this.httpApi.postUriEncoded("/api/logs/delete", args);
            };
            return LogService;
        }());
        LogService.$inject = ["httpApi"];
        Chavah.LogService = LogService;
        Chavah.App.service("logApi", LogService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=LogService.js.map