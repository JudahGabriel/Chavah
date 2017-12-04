namespace BitShuva.Chavah {
    export class LogService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        getAll(skip: number, take: number): ng.IPromise<Server.IPagedList<Server.ILogSummary>> {
            let args = {
                skip,
                take,
            };
            return this.httpApi.query("/api/logs/getAll", args);
        }

        deleteLog(id: string): ng.IPromise<any> {
            let args = {
                id,
            };
            return this.httpApi.postUriEncoded("/api/logs/delete", args);
        }
    }

    App.service("logApi", LogService);
}
