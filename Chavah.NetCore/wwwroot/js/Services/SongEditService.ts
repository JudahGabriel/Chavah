namespace BitShuva.Chavah {
    
    export class SongEditService {

        static $inject = [
            "httpApi"
        ];

        constructor(private httpApi: HttpApiService) {
        }

        submit(song: Song): ng.IPromise<Server.ISongEdit> {
            return this.httpApi.post("/api/songEdits/edit", song);
        }

        getPendingEdits(take: number): ng.IPromise<Server.ISongEdit[]> {
            var args = {
                take: take
            }
            return this.httpApi.query("/api/songEdits/getPendingEdits", args);
        }

        approve(songEdit: Server.ISongEdit): ng.IPromise<Server.ISongEdit> {
            return this.httpApi.post("/api/songEdits/approve", songEdit);
        }

        reject(songEditId: string): ng.IPromise<Server.ISongEdit | null> {
            var args = {
                songEditId: songEditId
            };
            return this.httpApi.postUriEncoded<Server.ISongEdit | null>("/api/songEdits/reject", args);
        }
    }

    App.service("songEditApi", SongEditService);
}