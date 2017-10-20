var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LogEditorController = (function () {
            function LogEditorController(logApi) {
                var _this = this;
                this.logApi = logApi;
                this.logs = new Chavah.PagedList(function (skip, take) { return _this.logApi.getAll(skip, take); });
                this.isSaving = false;
                this.logs.fetchNextChunk();
            }
            LogEditorController.prototype.getTimeAgo = function (dateIso) {
                return moment(dateIso).fromNow(false);
            };
            LogEditorController.prototype.getFriendlyDate = function (dateIso) {
                return moment(dateIso).utcOffset(-6).format("dddd MMMM DD, YYYY h:mma") + " (CST)";
            };
            LogEditorController.prototype.deleteLog = function (log) {
                var _this = this;
                if (!this.isSaving) {
                    this.isSaving = true;
                    this.logApi.deleteLog(log.id)
                        .then(function () { return _this.logs.resetAndFetch(); })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            LogEditorController.prototype.getOccurrencesText = function (log) {
                if (log.occurrences && log.occurrences.length) {
                    return log.occurrences.map(function (o) { return JSON.stringify(o, null, 4); });
                }
                return [];
            };
            return LogEditorController;
        }());
        LogEditorController.$inject = ["logApi"];
        Chavah.LogEditorController = LogEditorController;
        Chavah.App.controller("LogEditorController", LogEditorController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
