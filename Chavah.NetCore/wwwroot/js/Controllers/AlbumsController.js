var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AlbumsController = (function () {
            function AlbumsController(albumApi, appNav) {
                var _this = this;
                this.albumApi = albumApi;
                this.appNav = appNav;
                this.search = "";
                this.albums = new Chavah.PagedList(function (skip, take) { return _this.albumApi.getAll(skip, take, _this.search); });
                this.isSaving = false;
                this.albums.take = 50;
                this.albums.fetchNextChunk();
            }
            AlbumsController.prototype.searchChanged = function () {
                this.albums.resetAndFetch();
            };
            AlbumsController.prototype.deleteAlbum = function (album) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.isSaving = true;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, , 3, 4]);
                                return [4 /*yield*/, this.albumApi.deleteAlbum(album.id)];
                            case 2:
                                _a.sent();
                                _.pull(this.albums.items, album);
                                return [3 /*break*/, 4];
                            case 3:
                                this.isSaving = false;
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            };
            return AlbumsController;
        }());
        AlbumsController.$inject = [
            "albumApi",
            "appNav",
        ];
        Chavah.AlbumsController = AlbumsController;
        Chavah.App.controller("AlbumsController", AlbumsController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AlbumsController.js.map