var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var CropImageController = /** @class */ (function () {
            function CropImageController(imageFile, $uibModalInstance, $q) {
                var _this = this;
                this.$uibModalInstance = $uibModalInstance;
                this.$q = $q;
                this.rawImage = null; // base64 encoded URL
                this.croppedImage = null;
                this.croppedBase64 = null;
                // We want to read the raw image, and initialize the image cropper, only when we're visible and have loaded the data.
                var loadImageTask = this.loadRawImage(imageFile);
                var modalRenderedTask = $uibModalInstance.rendered;
                $q.all([loadImageTask, modalRenderedTask])
                    .then(function (results) { return _this.rawImage = results[0]; });
            }
            CropImageController.prototype.loadRawImage = function (imageFile) {
                var task = this.$q.defer();
                var reader = new FileReader();
                reader.addEventListener("load", function () { return task.resolve(reader.result); }, false);
                reader.readAsDataURL(imageFile);
                return task.promise;
            };
            CropImageController.prototype.close = function () {
                this.$uibModalInstance.close();
            };
            CropImageController.prototype.apply = function () {
                var result = {
                    image: this.croppedImage,
                    imageBase64: this.croppedBase64
                };
                this.$uibModalInstance.close(result);
            };
            CropImageController.$inject = [
                "imageFile",
                "$uibModalInstance",
                "$q"
            ];
            return CropImageController;
        }());
        Chavah.CropImageController = CropImageController;
        Chavah.App.controller("CropImageController", CropImageController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=CropImageController.js.map