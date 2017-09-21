var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var EditSongController = (function () {
            function EditSongController(songApi, songEditApi, tagApi, accountApi, appNav, $routeParams) {
                var _this = this;
                this.songApi = songApi;
                this.songEditApi = songEditApi;
                this.tagApi = tagApi;
                this.song = null;
                this.tagsInput = "";
                this.isSaving = false;
                this.isSaveSuccess = false;
                this.isSaveFail = false;
                this.tags = [];
                this.isLyricsFocused = true;
                this.tagPlaceholder = "piano, violin, male vocal, hebrew, psalms";
                if (!accountApi.isSignedIn) {
                    appNav.promptSignIn();
                }
                else {
                    var songId = "songs/" + $routeParams["id"];
                    if (songId) {
                        songApi.getSongById(songId)
                            .then(function (result) { return _this.songLoaded(result); });
                    }
                    this.isAdmin = !!accountApi.currentUser && accountApi.currentUser.isAdmin;
                }
            }
            EditSongController.prototype.searchTags = function (search) {
                return this.tagApi.searchTags(search);
            };
            EditSongController.prototype.songLoaded = function (song) {
                this.song = song;
                if (song) {
                    this.tags = song.tags || [];
                    if (this.tags.length > 0) {
                        this.tagPlaceholder = "";
                    }
                }
            };
            EditSongController.prototype.tagsInputChanged = function () {
                var _this = this;
                // If the user typed a comma, add any existing tag
                if (this.tagsInput.includes(",")) {
                    var tags = this.tagsInput.split(",");
                    this.tagsInput = "";
                    tags.filter(function (t) { return t && t.length > 1; }).forEach(function (t) { return _this.addTag(t); });
                }
            };
            EditSongController.prototype.removeTag = function (tag) {
                var tagIndex = this.tags.indexOf(tag);
                if (tagIndex >= 0) {
                    this.tags.splice(tagIndex, 1);
                }
            };
            EditSongController.prototype.autoCompleteTagSelected = function (tag) {
                this.addTag(tag);
                this.tagsInput = "";
            };
            EditSongController.prototype.addTag = function (tag) {
                var tagLowered = tag.toLowerCase().trim();
                if (!this.tags.includes(tagLowered) && tagLowered.length > 1) {
                    this.tags.push(tagLowered);
                    this.tagPlaceholder = "";
                }
            };
            EditSongController.prototype.tagsEnterKeyPressed = function () {
                if (this.tagsInput.length > 1) {
                    this.autoCompleteTagSelected(this.tagsInput);
                }
            };
            EditSongController.prototype.submit = function () {
                var _this = this;
                if (this.song && !this.isSaving) {
                    this.song.tags = this.tags;
                    this.isSaving = true;
                    this.songEditApi.submit(this.song)
                        .then(function () { return _this.isSaveSuccess = true; })
                        .catch(function (error) { return _this.isSaveFail = true; })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            return EditSongController;
        }());
        EditSongController.$inject = [
            "songApi",
            "songEditApi",
            "tagApi",
            "accountApi",
            "appNav",
            "$routeParams"
        ];
        Chavah.EditSongController = EditSongController;
        Chavah.App.controller("EditSongController", EditSongController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
