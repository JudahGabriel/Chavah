namespace BitShuva.Chavah {
    export class LogService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        getAll(skip: number, take: number, level: LogLevel | null, sort: LogSort): ng.IPromise<Server.PagedList<StructuredLog>> {
            let args = {
                skip,
                take,
                level: level,
                sort: sort
            };
            return this.httpApi.query("/api/logs/getAll", args, LogService.pagedListSelector);
        }

        deleteLog(id: string): ng.IPromise<any> {
            const args = {
                id,
            };
            return this.httpApi.postUriEncoded("/api/logs/delete", args);
        }

        static pagedListSelector(input: Server.PagedList<Server.StructuredLog>): Server.PagedList<StructuredLog> {
            return {
                skip: input.skip,
                take: input.take,
                total: input.total,
                items: input.items.map(i => new StructuredLog(i))
            };
        }
    }

    App.service("logApi", LogService);
}
