namespace BitShuva.Chavah {
    export class AlbumApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        /**
         * Uploads a new album. Returns a promise containing the ID of the new album.
         */
        upload(album: Server.IAlbumUpload): ng.IPromise<string> {
            return this.httpApi.post("/api/albums/upload", album);
        }
    }

    App.service("albumApi", AlbumApiService);
}