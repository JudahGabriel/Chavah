namespace BitShuva.Chavah {
    export class EditArtistController {
        private artist: Artist | null;

        static $inject = [
            "artistApi",
            "$routeParams",
            "$scope"
        ];

        constructor(
            private artistApi: ArtistApiService,
            $routeParams: ng.route.IRouteParamsService,
            private $scope: ng.IScope) {

            var artistName: string | null = $routeParams["artistName"];
            if (artistName && artistName.length > 0) {
                this.artistApi.getByName(artistName)
                    .then(result => this.artist = result);
            } else {
                // Launched without an artist name. Create new.
                this.artist = new Artist();
            }
        }

        removeImage(image: string) {
            if (this.artist) {
                this.artist.images = this.artist.images.filter(i => i !== image);
            }
        }

        addImages() {
            filepicker.setKey(UploadAlbumController.filePickerKey)
            var options: FilepickerMultipleFilePickOptions = {
                extensions: [".jpg", ".png"],
                maxFiles: 100
            };
            filepicker.pickMultiple(
                options,
                (result: FilepickerInkBlob[]) => this.imagesAdded(result),
                (error) => console.log("Failed to add image.", error));
        }

        imagesAdded(images: FilepickerInkBlob[]) {
            images.forEach(i => this.artist!.images.push(i.url));
            this.$scope.$applyAsync();
        }

        save() {
            if (this.artist && !this.artist.isSaving) {
                this.artist.isSaving = true;
                this.artistApi.save(this.artist)
                    .then(result => this.artist!.updateFrom(result))
                    .finally(() => this.artist!.isSaving = false);
            }
        }
    }

    App.controller("EditArtistController", EditArtistController as any)
}