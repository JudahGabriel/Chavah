namespace BitShuva.Chavah {
    export class LogService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        getAll(skip: number, take: number): ng.IPromise<Server.IPagedList<Server.ILogSummary>> {
            var args = {
                skip: skip,
                take: take
            };
            return this.httpApi.query("/api/logs/getAll", args);
        }

        deleteLog(logId: string): ng.IPromise<any> {
            var args = {
                id: logId
            };
            return this.httpApi.postUriEncoded("/api/logs/delete", args);
        }
    }

    App.service("logApi", LogService);
}