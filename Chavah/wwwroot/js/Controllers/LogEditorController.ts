
namespace BitShuva.Chavah {

    export class LogEditorController {

        logs = new PagedList((skip: number, take: number) => this.logApi.getAll(skip, take, this.selectedFilter.value as LogLevel | null, this.selectedSort.value as LogSort));
        saving = false;
        timeAgoCache: any = {};
        filterOptions: ToggleOption[] = [
            { title: "All", value: null as any, description: "" },
            { title: "Critical", value: LogLevel.Critical, description: "text-danger" },
            { title: "Error", value: LogLevel.Error, description: "text-danger" },
            { title: "Warning", value: LogLevel.Warning, description: "text-warning" },
            { title: "Info", value: LogLevel.Information, description: "text-info" },
            { title: "Debug", value: LogLevel.Debug, description: "text-info" },
            { title: "Trace", value: LogLevel.Trace, description: "text-info" }
        ];
        selectedFilter = this.filterOptions[0];
        sortOptions: ToggleOption[] = [
            { title: "Newest", value: LogSort.Newest },
            { title: "Oldest", value: LogSort.Oldest },
            { title: "Total occurrences", value: LogSort.OccurrenceCount }
        ];
        selectedSort = this.sortOptions[0];

        static $inject = [
            "logApi"
        ];

        constructor(private readonly logApi: LogService) {
        }

        $onInit() {
            this.logs.fetchNextChunk();
        }

        getTimeAgo(dateIso: string): string {
            const existing = this.timeAgoCache[dateIso];
            if (existing) {
                return existing;
            }

            const date = moment(dateIso).local();
            const timeAgo = date.diff(moment());
            const totalMs = Math.abs(timeAgo);
            const totalSeconds = totalMs / 1000;
            const totalMinutes = totalSeconds / 60;
            const totalHours = totalMinutes / 60;
            const totalDays = totalHours / 24;
            let result = "";
            if (totalDays >= 1) {
                result = `${Math.floor(totalDays)} day${totalDays >= 2 ? "s" : ""} ago (${date.format('M/D/YY H:mm a')})`;
            } else if (totalHours >= 1) {
                result = `${Math.floor(totalHours)} hour${totalHours >= 2 ? "s" : ""} ago`;
            } else if (totalMinutes >= 1) {
                result = `${Math.floor(totalMinutes)} minute${totalMinutes >= 2 ? "s" : ""} ago`;
            } else {
                result = "less than a minute ago";
            }

            this.timeAgoCache[dateIso] = result;
            return result;
        }

        getFriendlyDate(dateIso: string): string {
            return moment(dateIso)
                .local()
                .format("dddd MMMM DD, YYYY h:mma");
        }

        deleteLog(log: StructuredLog) {
            if (!this.saving) {
                this.saving = true;
                this.logApi.deleteLog(log.id)
                    .then(() => this.logs.resetAndFetch())
                    .finally(() => this.saving = false);
            }
        }

        getActiveOccurrenceText(log: StructuredLog): string {
            const active = log.occurrences[log.activeOccurrenceIndex];
            if (active) {
                return JSON.stringify(active, null, 4);
            }

            return "";
        }

        getIconClass(level: LogLevel | null): string {
            switch (level) {
                case LogLevel.Critical:
                case LogLevel.Error:
                    return "fa-exclamation-circle text-danger";
                case LogLevel.Warning:
                    return "fa-exclamation-triangle text-warning";
                case LogLevel.Information:
                case LogLevel.Debug:
                case LogLevel.Trace:
                    return "fa-info-circle text-info";
                default:
                    return "";
            }
        }

        getLogClass(log: StructuredLog): string {
            switch (log.level) {
                case LogLevel.Critical:
                    return "left-border border-danger text-danger"
                case LogLevel.Error:
                    return "left-border border-danger";
                case LogLevel.Warning:
                    return "left-border border-warning";
                case LogLevel.Information:
                    return "left-border border-info";
                default:
                    return "";
            }
        }

        getLevelDescription(level: LogLevel): string {
            var option = this.filterOptions.find(o => o.value === level);
            return option ? option.title : "";
        }

        getException(log: StructuredLog): string | null {
            const logWithException = log.occurrences.find(o => !!o.exception);
            return logWithException ? logWithException.exception : null;
        }

        getLogLevel(log: StructuredLog): string {
            switch (log.level) {
                case LogLevel.Critical: return "Critical";
                case LogLevel.Error: return "Error";
                case LogLevel.Warning: return "Warn";
                case LogLevel.Information: return "Info";
                case LogLevel.Debug: return "Debug";
                case LogLevel.Trace: return "Trace";
                default: return "";
            }
        }

        getLogDetails(log: StructuredLog) {
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
        }

        selectFilter(filter: ToggleOption) {
            if (this.selectedFilter !== filter) {
                this.selectedFilter = filter;
                this.logs.resetAndFetch();
            }
        }

        selectSort(sort: ToggleOption) {
            if (this.selectedSort !== sort) {
                this.selectedSort = sort;
                this.logs.resetAndFetch();
            }
        }
    }

    App.controller("LogEditorController", LogEditorController);
}
