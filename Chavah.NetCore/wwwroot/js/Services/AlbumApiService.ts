namespace BitShuva.Chavah {
    export class AlbumApiService {

        static $inject = [
            "httpApi",
            "$q",
        ];

        constructor(
            private httpApi: HttpApiService,
            private $q: ng.IQService) {
        }

        /**
         * Uploads a new album. Returns a promise containing the ID of the new album.
         */
        upload(album: Server.AlbumUpload): ng.IPromise<string> {
            return this.httpApi.post("/api/albums/upload", album);
        }

        /**
         * Uploads a media file, such as a song, for an album.
         * @param file The media file to upload.
         */
        uploadTempFile(file: File): ng.IPromise<Server.TempFile> {
            const form = new FormData();
            form.set("file", file);
            return this.httpApi.postFormData("/api/albums/uploadTempFile", form);
        }

        changeArt(albumId: string, artUri: string) {
            const args = {
                albumId,
                artUri,
            };
            return this.httpApi.postUriEncoded("/api/albums/changeArt", args, AlbumApiService.albumSelector);
        }

        get(id: string): ng.IPromise<Album | null> {
            const args = {
                id,
            };
            return this.httpApi.query<Album | null>("/api/albums/get", args, AlbumApiService.albumSelector);
        }

        getAll(skip: number, take: number, search: string | null): ng.IPromise<Server.PagedList<Album>> {
            const args = {
                skip,
                take,
                search,
            };
            return this.httpApi.query("/api/albums/getAll", args, AlbumApiService.albumPagedListSelector);
        }

        getByArtistAndAlbumName(artist: string, album: string): ng.IPromise<Album | null> {
            const args = {
                artist,
                album,
            };
            return this.httpApi.query<Album | null>("/api/albums/getByArtistAlbum",
                                                                args, AlbumApiService.albumSelector);
        }

        save(album: Album): ng.IPromise<Album> {
            return this.httpApi.post<Album>("/api/albums/save", album, a => new Album(a));
        }

        getAlbums(albumIds: string[]): ng.IPromise<Album[]> {
            const args = {
                albumIdsCsv: albumIds.join(","),
            };
            return this.httpApi.query("/api/albums/getAlbums", args, AlbumApiService.albumArraySelector);
        }

        getLikedAlbums(skip: number, take: number, search: string): ng.IPromise<Server.PagedList<Server.AlbumWithNetLikeCount>> {
            const args = {
                skip,
                take,
                search
            };
            return this.httpApi.query("/api/albums/getLikedAlbums", args);
        }

        // getAlbumsForSongs(songIds: string[]): ng.IPromise<Album[]> {
        //    var songIdsCsv = songIds.join(",");
        //    if (songIdsCsv.length === 0) {
        //        return this.$q.resolve<Album[]>([]);
        //    }

        //    var args = {
        //        songIdsCsv: songIdsCsv
        //    };
        //    return this.httpApi.query("/api/albums/GetAlbumsForSongs", args, AlbumApiService.albumArraySelector);
        // }

        deleteAlbum(albumId: string): ng.IPromise<any> {
            let args = {
                albumId,
            };
            return this.httpApi.postUriEncoded("/api/albums/delete", args);
        }

        // tslint:disable-next-line:member-ordering
        static albumSelector(serverObj: Server.Album | null): Album | null {
            if (serverObj) {
                return new Album(serverObj);
            }

            return null;
        }

        // tslint:disable-next-line:member-ordering
        static albumArraySelector(serverObjs: Server.Album[]): Album[] {
            return serverObjs.map(s => AlbumApiService.albumSelector(s)!);
        }

        // tslint:disable-next-line:member-ordering
        static albumPagedListSelector(serverObj: Server.PagedList<Server.Album>): Server.PagedList<Album> {
            return {
                items: AlbumApiService.albumArraySelector(serverObj.items),
                skip: serverObj.skip,
                take: serverObj.take,
                total: serverObj.total,
            };
        }
    }

    App.service("albumApi", AlbumApiService);
}
