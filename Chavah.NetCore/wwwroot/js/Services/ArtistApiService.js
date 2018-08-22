var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ArtistApiService = /** @class */ (function () {
            function ArtistApiService(httpApi) {
                this.httpApi = httpApi;
            }
            ArtistApiService.prototype.getAll = function (search, skip, take) {
                if (search === void 0) { search = ""; }
                if (skip === void 0) { skip = 0; }
                if (take === void 0) { take = 1024; }
                var args = {
                    search: search,
                    skip: skip,
                    take: take,
                };
                return this.httpApi.query("/api/artists/getAll", args);
            };
            ArtistApiService.prototype.getByName = function (artistName) {
                var args = {
                    artistName: artistName,
                };
                return this.httpApi.query("/api/artists/getByName", args, ArtistApiService.artistSelector);
            };
            ArtistApiService.prototype.save = function (artist) {
                return this.httpApi.post("/api/artists/save", artist, ArtistApiService.artistSelector);
            };
            ArtistApiService.prototype.getLikedArtists = function (skip, take, search) {
                var args = {
                    skip: skip,
                    take: take,
                    search: search
                };
                return this.httpApi.query("/api/artists/getLikedArtists", args);
            };
            // tslint:disable-next-line:member-ordering
            ArtistApiService.artistSelector = function (serverObj) {
                return new Chavah.Artist(serverObj);
            };
            ArtistApiService.$inject = ["httpApi"];
            return ArtistApiService;
        }());
        Chavah.ArtistApiService = ArtistApiService;
        Chavah.App.service("artistApi", ArtistApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=ArtistApiService.js.map