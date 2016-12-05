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

        get(id: string): ng.IPromise<Album | null> {
            var args = {
                id: id
            };
            return this.httpApi.query<Server.IAlbum | null>("/api/albums/get", args, AlbumApiService.albumSelector);
        }

        getByArtistAndAlbumName(artist: string, album: string): ng.IPromise<Album | null> {
            var args = {
                artist: artist,
                album: album
            };
            return this.httpApi.query<Server.IAlbum | null>("/api/albums/getByArtistAlbum", args, AlbumApiService.albumSelector);
        }

        save(album: Album): ng.IPromise<Album> {
            return this.httpApi.post("/api/albums/save", album, AlbumApiService.albumSelector);
        }

        getAlbumsForSongs(songIds: string[]): ng.IPromise<Album[]> {
            var args = {
                songIdsCsv: songIds.join(",")
            };
            return this.httpApi.query("/api/albums/GetAlbumsForSongs", args, AlbumApiService.albumArraySelector);
        }

        zanzFetchNullArt(): ng.IPromise<Album | null> {
            return this.httpApi.query<Server.IAlbum | null>("/api/albums/NullColors", null, AlbumApiService.albumSelector);
        }

        static albumSelector(serverObj: Server.IAlbum | null): Album | null {
            if (serverObj) {
                return new Album(serverObj);
            } 

            return null;
        }

        static albumArraySelector(serverObjs: Server.IAlbum[]): Album[] {
            return serverObjs.map(s => AlbumApiService.albumSelector(s)!);
        }
    }

    App.service("albumApi", AlbumApiService);
}