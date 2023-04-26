var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var TagEditorController = /** @class */ (function () {
            function TagEditorController(tagApi) {
                var _this = this;
                this.tagApi = tagApi;
                this.allTags = [];
                this.selectedTag = null;
                this.newTagName = "";
                this.isSaving = false;
                this.tagApi.getAll()
                    .then(function (results) { return _this.allTags = results.sort(); });
            }
            TagEditorController.prototype.selectTag = function (tag) {
                this.newTagName = tag || "";
                this.selectedTag = tag;
            };
            TagEditorController.prototype.deleteTag = function (tag) {
                var _this = this;
                if (!this.isSaving) {
                    this.isSaving = true;
                    this.tagApi.deleteTag(tag)
                        .then(function () {
                        _.pull(_this.allTags, tag);
                        _this.selectTag(null);
                    })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            TagEditorController.prototype.renameTag = function (oldTag) {
                var _this = this;
                var newTagName = this.newTagName;
                if (!this.isSaving && newTagName !== oldTag) {
                    this.isSaving = true;
                    this.tagApi.renameTag(oldTag, newTagName)
                        .then(function (result) {
                        var oldTagIndex = _this.allTags.indexOf(oldTag);
                        if (oldTagIndex >= 0) {
                            _this.allTags[oldTagIndex] = result;
                            _this.allTags = _.uniq(_this.allTags);
                        }
                        _this.selectTag(newTagName);
                    })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            TagEditorController.$inject = ["tagApi"];
            return TagEditorController;
        }());
        Chavah.TagEditorController = TagEditorController;
        Chavah.App.controller("TagEditorController", TagEditorController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=TagEditorController.js.map