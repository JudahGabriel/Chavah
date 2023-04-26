var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var EditSongsController = /** @class */ (function () {
            function EditSongsController(songApi, appNav) {
                var _this = this;
                this.songApi = songApi;
                this.appNav = appNav;
                this.songs = new Chavah.PagedList(function (skip, take) { return _this.songApi.getSongsAdmin(skip, take, _this.search); });
                this.search = "";
            }
            EditSongsController.prototype.$onInit = function () {
                this.songs.fetchNextChunk();
            };
            EditSongsController.prototype.searchChanged = function () {
                this.songs.resetAndFetch();
            };
            EditSongsController.prototype.deleteSong = function (song) {
                return __awaiter(this, void 0, void 0, function () {
                    var confirmDeleteDialog, isDeleted;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                confirmDeleteDialog = this.appNav.confirmDeleteSong(song);
                                return [4 /*yield*/, confirmDeleteDialog.result];
                            case 1:
                                isDeleted = _a.sent();
                                if (isDeleted) {
                                    _.pull(this.songs.items, song);
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
            EditSongsController.$inject = [
                "songApi",
                "appNav"
            ];
            return EditSongsController;
        }());
        Chavah.EditSongsController = EditSongsController;
        Chavah.App.controller("EditSongsController", EditSongsController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=EditSongsController.js.map