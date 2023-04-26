namespace BitShuva.Chavah {
    export class CommentThreadService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        get(id: string): ng.IPromise<Server.CommentThread> {
            const args = {
                id
            };
            return this.httpApi.query("/api/commentThreads/get", args);
        }

        addComment(comment: string, songId: string): ng.IPromise<Server.CommentThread> {
            const args = {
                content: comment,
                songId: songId
            };
            return this.httpApi.post("/api/commentThreads/addComment", args);
        }
    }

    App.service("commentThreadApi", CommentThreadService);
}
