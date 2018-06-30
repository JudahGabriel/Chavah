namespace BitShuva.Chavah {

    export class SongEditService {

        static $inject = [
            "httpApi",
        ];

        constructor(private httpApi: HttpApiService) {
        }

        getSongEdit(songId: string): ng.IPromise<Server.SongEdit> {
            const args = {
                songId: songId
            };
            return this.httpApi.query("/api/songEdits/get", args);
        }

        submit(song: Song): ng.IPromise<Server.SongEdit> {
            return this.httpApi.post("/api/songEdits/editSong", song);
        }

        getPendingEdits(take: number): ng.IPromise<Server.SongEdit[]> {
            let args = {
                take,
            };
            return this.httpApi.query("/api/songEdits/getPendingEdits", args);
        }

        approve(songEdit: Server.SongEdit): ng.IPromise<Server.SongEdit> {
            return this.httpApi.post("/api/songEdits/approve", songEdit);
        }

        reject(songEditId: string): ng.IPromise<Server.SongEdit | null> {
            let args = {
                songEditId,
            };
            return this.httpApi.postUriEncoded<Server.SongEdit | null>("/api/songEdits/reject", args);
        }
    }

    App.service("songEditApi", SongEditService);
}
