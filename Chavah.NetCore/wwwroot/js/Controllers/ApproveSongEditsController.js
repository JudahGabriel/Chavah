var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ApproveSongEditsController = (function () {
            function ApproveSongEditsController(songApi, songEditApi, tagApi) {
                var _this = this;
                this.songApi = songApi;
                this.songEditApi = songEditApi;
                this.tagApi = tagApi;
                this.pendingEdits = [];
                this.currentEdit = null;
                this.isSaving = false;
                this.hasLoaded = false;
                this.tagsInput = "";
                this.songEditApi.getPendingEdits(20)
                    .then(function (results) { return _this.pendingEditsLoaded(results); });
            }
            ApproveSongEditsController.prototype.pendingEditsLoaded = function (results) {
                this.pendingEdits = results;
                this.setCurrentEdit(results[0]);
                this.hasLoaded = true;
            };
            ApproveSongEditsController.prototype.setCurrentEdit = function (songEdit) {
                this.currentEdit = songEdit;
            };
            ApproveSongEditsController.prototype.approve = function () {
                var _this = this;
                var edit = this.currentEdit;
                if (!this.isSaving && edit) {
                    this.isSaving = true;
                    this.songEditApi.approve(edit)
                        .then(function (results) { return _this.removeSongEdit(results.id); })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            ApproveSongEditsController.prototype.reject = function () {
                var _this = this;
                var edit = this.currentEdit;
                if (!this.isSaving && edit) {
                    this.isSaving = true;
                    this.songEditApi.reject(edit.id)
                        .then(function (result) {
                        if (result) {
                            _this.removeSongEdit(result.id);
                        }
                    })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            ApproveSongEditsController.prototype.removeSongEdit = function (editId) {
                this.pendingEdits = this.pendingEdits.filter(function (e) { return e.id !== editId; });
                if (this.currentEdit && this.currentEdit.id === editId) {
                    this.setCurrentEdit(this.pendingEdits[0]);
                }
            };
            ApproveSongEditsController.prototype.removeTag = function (tag) {
                if (this.currentEdit) {
                    var index = this.currentEdit.newTags.indexOf(tag);
                    if (index >= 0) {
                        this.currentEdit.newTags.splice(index, 1);
                    }
                }
            };
            ApproveSongEditsController.prototype.autoCompleteTagSelected = function (tag) {
                this.addTag(tag);
                this.tagsInput = "";
            };
            ApproveSongEditsController.prototype.addTag = function (tag) {
                if (this.currentEdit) {
                    var tagLowered = tag.toLowerCase().trim();
                    if (!this.currentEdit.newTags.includes(tagLowered) && tagLowered.length > 1) {
                        this.currentEdit.newTags.push(tagLowered);
                    }
                }
            };
            ApproveSongEditsController.prototype.tagsInputChanged = function () {
                var _this = this;
                // If the user typed a comma, add any existing tag
                if (this.tagsInput.includes(",")) {
                    var tags = this.tagsInput.split(",");
                    this.tagsInput = "";
                    tags
                        .filter(function (t) { return t && t.length > 1; })
                        .forEach(function (t) { return _this.addTag(t); });
                }
            };
            ApproveSongEditsController.prototype.tagsEnterKeyPressed = function () {
                if (this.tagsInput.length > 1) {
                    this.autoCompleteTagSelected(this.tagsInput);
                }
            };
            ApproveSongEditsController.prototype.searchTags = function (search) {
                return this.tagApi.searchTags(search);
            };
            return ApproveSongEditsController;
        }());
        ApproveSongEditsController.$inject = [
            "songApi",
            "songEditApi",
            "tagApi",
        ];
        Chavah.ApproveSongEditsController = ApproveSongEditsController;
        Chavah.App.controller("ApproveSongEditsController", ApproveSongEditsController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=ApproveSongEditsController.js.map