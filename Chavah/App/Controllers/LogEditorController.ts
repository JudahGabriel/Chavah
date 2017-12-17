namespace BitShuva.Chavah {
    export class LogEditorController {

        logs = new PagedList((skip: number, take: number) => this.logApi.getAll(skip, take));
        isSaving = false;

        static $inject = ["logApi"];

        constructor(private readonly logApi: LogService) {
            this.logs.fetchNextChunk();
        }

        getTimeAgo(dateIso: string): string {
            return moment(dateIso).fromNow(false);
        }

        getFriendlyDate(dateIso: string): string {
            return moment(dateIso).utcOffset(-6).format("dddd MMMM DD, YYYY h:mma") + " (CST)"
        }

        deleteLog(log: Server.ILogSummary) {
            if (!this.isSaving) {
                this.isSaving = true;
                this.logApi.deleteLog(log.id)
                    .then(() => this.logs.resetAndFetch())
                    .finally(() => this.isSaving = false);
            }
        }

        getOccurrencesText(log: Server.ILogSummary): string[] {
            if (log.occurrences && log.occurrences.length) {
                return log.occurrences.map(o => JSON.stringify(o, null, 4));
            }

            return [];
        }
    }

    App.controller("LogEditorController", LogEditorController as any);
}