var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AlbumApiService = /** @class */ (function () {
            function AlbumApiService(httpApi, $q) {
                this.httpApi = httpApi;
                this.$q = $q;
            }
            /**
             * Uploads a new album. Returns a promise containing the ID of the new album.
             */
            AlbumApiService.prototype.upload = function (album) {
                return this.httpApi.post("/api/albums/upload", album);
            };
            AlbumApiService.prototype.changeArt = function (albumId, artUri) {
                var args = {
                    albumId: albumId,
                    artUri: artUri,
                };
                return this.httpApi.postUriEncoded("/api/albums/changeArt", args, AlbumApiService.albumSelector);
            };
            AlbumApiService.prototype.get = function (id) {
                var args = {
                    id: id,
                };
                return this.httpApi.query("/api/albums/get", args, AlbumApiService.albumSelector);
            };
            AlbumApiService.prototype.getAll = function (skip, take, search) {
                var args = {
                    skip: skip,
                    take: take,
                    search: search,
                };
                return this.httpApi.query("/api/albums/getAll", args, AlbumApiService.albumPagedListSelector);
            };
            AlbumApiService.prototype.getByArtistAndAlbumName = function (artist, album) {
                var args = {
                    artist: artist,
                    album: album,
                };
                return this.httpApi.query("/api/albums/getByArtistAlbum", args, AlbumApiService.albumSelector);
            };
            AlbumApiService.prototype.save = function (album) {
                return this.httpApi.post("/api/albums/save", album, function (a) { return new Chavah.Album(a); });
            };
            AlbumApiService.prototype.getAlbums = function (albumIds) {
                var args = {
                    albumIdsCsv: albumIds.join(","),
                };
                return this.httpApi.query("/api/albums/getAlbums", args, AlbumApiService.albumArraySelector);
            };
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
            AlbumApiService.prototype.deleteAlbum = function (albumId) {
                var args = {
                    albumId: albumId,
                };
                return this.httpApi.postUriEncoded("/api/albums/delete", args);
            };
            // tslint:disable-next-line:member-ordering
            AlbumApiService.albumSelector = function (serverObj) {
                if (serverObj) {
                    return new Chavah.Album(serverObj);
                }
                return null;
            };
            // tslint:disable-next-line:member-ordering
            AlbumApiService.albumArraySelector = function (serverObjs) {
                return serverObjs.map(function (s) { return AlbumApiService.albumSelector(s); });
            };
            // tslint:disable-next-line:member-ordering
            AlbumApiService.albumPagedListSelector = function (serverObj) {
                return {
                    items: AlbumApiService.albumArraySelector(serverObj.items),
                    skip: serverObj.skip,
                    take: serverObj.take,
                    total: serverObj.total,
                };
            };
            AlbumApiService.$inject = [
                "httpApi",
                "$q",
            ];
            return AlbumApiService;
        }());
        Chavah.AlbumApiService = AlbumApiService;
        Chavah.App.service("albumApi", AlbumApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AlbumApiService.js.map