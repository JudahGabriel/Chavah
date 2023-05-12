namespace BitShuva.Chavah {
    export class EditArtistController {
        static $inject = [
            "artistApi",
            "$routeParams",
            "$scope",
            "homeViewModel"
        ];

        private artist: Artist | null;

        constructor(
            private artistApi: ArtistApiService,
            $routeParams: ng.route.IRouteParamsService,
            private $scope: ng.IScope,
            private homeViewModel: Server.HomeViewModel) {

            let artistName: string | null = $routeParams["artistName"];
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
            //filepicker.setKey(this.homeViewModel.filePickrKey);
            //let options: FilepickerMultipleFilePickOptions = {
            //    extensions: [".jpg", ".png"],
            //    maxFiles: 100,
            //};
            //filepicker.pickMultiple(
            //    options,
            //    (result: FilepickerInkBlob[]) => this.imagesAdded(result),
            //    // tslint:disable-next-line:arrow-parens
            //    (error) => console.log("Failed to add image.", error));
            console.log("commented out filepickr");
        }

        //imagesAdded(images: FilepickerInkBlob[]) {
        //    images.forEach(i => this.artist!.images.push(i.url));
        //    this.$scope.$applyAsync();
        //}

        save() {
            if (this.artist && !this.artist.isSaving) {
                this.artist.isSaving = true;
                this.artistApi.save(this.artist)
                    .then(result => this.artist!.updateFrom(result))
                    .finally(() => this.artist!.isSaving = false);
            }
        }
    }

    App.controller("EditArtistController", EditArtistController);
}
