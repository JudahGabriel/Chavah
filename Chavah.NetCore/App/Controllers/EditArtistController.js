var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var EditArtistController = (function () {
            function EditArtistController(artistApi, $routeParams, $scope) {
                var _this = this;
                this.artistApi = artistApi;
                this.$scope = $scope;
                var artistName = $routeParams["artistName"];
                if (artistName && artistName.length > 0) {
                    this.artistApi.getByName(artistName)
                        .then(function (result) { return _this.artist = result; });
                }
                else {
                    // Launched without an artist name. Create new.
                    this.artist = new Chavah.Artist();
                }
            }
            EditArtistController.prototype.removeImage = function (image) {
                if (this.artist) {
                    this.artist.images = this.artist.images.filter(function (i) { return i !== image; });
                }
            };
            EditArtistController.prototype.addImages = function () {
                var _this = this;
                filepicker.setKey(Chavah.UploadAlbumController.filePickerKey);
                var options = {
                    extensions: [".jpg", ".png"],
                    maxFiles: 100
                };
                filepicker.pickMultiple(options, function (result) { return _this.imagesAdded(result); }, function (error) { return console.log("Failed to add image.", error); });
            };
            EditArtistController.prototype.imagesAdded = function (images) {
                var _this = this;
                images.forEach(function (i) { return _this.artist.images.push(i.url); });
                this.$scope.$applyAsync();
            };
            EditArtistController.prototype.save = function () {
                var _this = this;
                if (this.artist && !this.artist.isSaving) {
                    this.artist.isSaving = true;
                    this.artistApi.save(this.artist)
                        .then(function (result) { return _this.artist.updateFrom(result); })
                        .finally(function () { return _this.artist.isSaving = false; });
                }
            };
            return EditArtistController;
        }());
        EditArtistController.$inject = [
            "artistApi",
            "$routeParams",
            "$scope"
        ];
        Chavah.EditArtistController = EditArtistController;
        Chavah.App.controller("EditArtistController", EditArtistController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));