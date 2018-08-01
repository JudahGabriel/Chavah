namespace BitShuva.Chavah {
    export class CropImageController {

        rawImage: string | null = null; // base64 encoded URL
        croppedImage: Blob | null = null;
        croppedBase64: string | null = null;

        static $inject = [
            "imageFile",
            "$uibModalInstance",
            "$q"
        ];

        constructor(
            imageFile: File,
            private readonly $uibModalInstance: ng.ui.bootstrap.IModalServiceInstance,
            private $q: ng.IQService) {

            // We want to read the raw image, and initialize the image cropper, only when we're visible and have loaded the data.
            const loadImageTask = this.loadRawImage(imageFile);
            const modalRenderedTask = $uibModalInstance.rendered;
            $q.all([loadImageTask, modalRenderedTask])
                .then(results => this.rawImage = results[0]);
        }

        loadRawImage(imageFile: File): ng.IPromise<string> {
            const task = this.$q.defer<string>();
            const reader = new FileReader();
            reader.addEventListener("load", () => task.resolve(reader.result as string), false);
            reader.readAsDataURL(imageFile);
            return task.promise;
        }

        close() {
            this.$uibModalInstance.close();
        }

        apply() {
            const result: ICropImageResult = {
                image: this.croppedImage!,
                imageBase64: this.croppedBase64!
            };
            this.$uibModalInstance.close(result);
        }
    }

    App.controller("CropImageController", CropImageController);
}