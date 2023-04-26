var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LogEditorController = /** @class */ (function () {
            function LogEditorController(logApi) {
                var _this = this;
                this.logApi = logApi;
                this.logs = new Chavah.PagedList(function (skip, take) { return _this.logApi.getAll(skip, take, _this.selectedFilter.value, _this.selectedSort.value); });
                this.saving = false;
                this.timeAgoCache = {};
                this.filterOptions = [
                    { title: "All", value: null, description: "" },
                    { title: "Critical", value: Chavah.LogLevel.Critical, description: "text-danger" },
                    { title: "Error", value: Chavah.LogLevel.Error, description: "text-danger" },
                    { title: "Warning", value: Chavah.LogLevel.Warning, description: "text-warning" },
                    { title: "Info", value: Chavah.LogLevel.Information, description: "text-info" },
                    { title: "Debug", value: Chavah.LogLevel.Debug, description: "text-info" },
                    { title: "Trace", value: Chavah.LogLevel.Trace, description: "text-info" }
                ];
                this.selectedFilter = this.filterOptions[0];
                this.sortOptions = [
                    { title: "Newest", value: Chavah.LogSort.Newest },
                    { title: "Oldest", value: Chavah.LogSort.Oldest },
                    { title: "Total occurrences", value: Chavah.LogSort.OccurrenceCount }
                ];
                this.selectedSort = this.sortOptions[0];
            }
            LogEditorController.prototype.$onInit = function () {
                this.logs.fetchNextChunk();
            };
            LogEditorController.prototype.getTimeAgo = function (dateIso) {
                var existing = this.timeAgoCache[dateIso];
                if (existing) {
                    return existing;
                }
                var date = moment(dateIso).local();
                var timeAgo = date.diff(moment());
                var totalMs = Math.abs(timeAgo);
                var totalSeconds = totalMs / 1000;
                var totalMinutes = totalSeconds / 60;
                var totalHours = totalMinutes / 60;
                var totalDays = totalHours / 24;
                var result = "";
                if (totalDays >= 1) {
                    result = Math.floor(totalDays) + " day" + (totalDays >= 2 ? "s" : "") + " ago (" + date.format('M/D/YY H:mm a') + ")";
                }
                else if (totalHours >= 1) {
                    result = Math.floor(totalHours) + " hour" + (totalHours >= 2 ? "s" : "") + " ago";
                }
                else if (totalMinutes >= 1) {
                    result = Math.floor(totalMinutes) + " minute" + (totalMinutes >= 2 ? "s" : "") + " ago";
                }
                else {
                    result = "less than a minute ago";
                }
                this.timeAgoCache[dateIso] = result;
                return result;
            };
            LogEditorController.prototype.getFriendlyDate = function (dateIso) {
                return moment(dateIso)
                    .local()
                    .format("dddd MMMM DD, YYYY h:mma");
            };
            LogEditorController.prototype.deleteLog = function (log) {
                var _this = this;
                if (!this.saving) {
                    this.saving = true;
                    this.logApi.deleteLog(log.id)
                        .then(function () { return _this.logs.resetAndFetch(); })
                        .finally(function () { return _this.saving = false; });
                }
            };
            LogEditorController.prototype.getActiveOccurrenceText = function (log) {
                var active = log.occurrences[log.activeOccurrenceIndex];
                if (active) {
                    return JSON.stringify(active, null, 4);
                }
                return "";
            };
            LogEditorController.prototype.getIconClass = function (level) {
                switch (level) {
                    case Chavah.LogLevel.Critical:
                    case Chavah.LogLevel.Error:
                        return "fa-exclamation-circle text-danger";
                    case Chavah.LogLevel.Warning:
                        return "fa-exclamation-triangle text-warning";
                    case Chavah.LogLevel.Information:
                    case Chavah.LogLevel.Debug:
                    case Chavah.LogLevel.Trace:
                        return "fa-info-circle text-info";
                    default:
                        return "";
                }
            };
            LogEditorController.prototype.getLogClass = function (log) {
                switch (log.level) {
                    case Chavah.LogLevel.Critical:
                        return "left-border border-danger text-danger";
                    case Chavah.LogLevel.Error:
                        return "left-border border-danger";
                    case Chavah.LogLevel.Warning:
                        return "left-border border-warning";
                    case Chavah.LogLevel.Information:
                        return "left-border border-info";
                    default:
                        return "";
                }
            };
            LogEditorController.prototype.getLevelDescription = function (level) {
                var option = this.filterOptions.find(function (o) { return o.value === level; });
                return option ? option.title : "";
            };
            LogEditorController.prototype.getException = function (log) {
                var logWithException = log.occurrences.find(function (o) { return !!o.exception; });
                return logWithException ? logWithException.exception : null;
            };
            LogEditorController.prototype.getLogLevel = function (log) {
                switch (log.level) {
                    case Chavah.LogLevel.Critical: return "Critical";
                    case Chavah.LogLevel.Error: return "Error";
                    case Chavah.LogLevel.Warning: return "Warn";
                    case Chavah.LogLevel.Information: return "Info";
                    case Chavah.LogLevel.Debug: return "Debug";
                    case Chavah.LogLevel.Trace: return "Trace";
                    default: return "";
                }
            };
            LogEditorController.prototype.getLogDetails = function (log) {
                if (log.activeCategory === "Message") {
                    return log.messageTemplate;
                }
                if (log.activeCategory === "Exception") {
                    return this.getException(log);
                }
                if (log.activeCategory === "Occurrences") {
                    return this.getActiveOccurrenceText(log);
                }
                return "";
            };
            LogEditorController.prototype.selectFilter = function (filter) {
                if (this.selectedFilter !== filter) {
                    this.selectedFilter = filter;
                    this.logs.resetAndFetch();
                }
            };
            LogEditorController.prototype.selectSort = function (sort) {
                if (this.selectedSort !== sort) {
                    this.selectedSort = sort;
                    this.logs.resetAndFetch();
                }
            };
            LogEditorController.$inject = [
                "logApi"
            ];
            return LogEditorController;
        }());
        Chavah.LogEditorController = LogEditorController;
        Chavah.App.controller("LogEditorController", LogEditorController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=LogEditorController.js.map