namespace BitShuva.Chavah {
    export class EditAlbumController {

        album: Album | null = null;
        allAlbumSwatches: IAlbumSwatch[] = [];

        static $inject = [
            "albumApi",
            "appNav",
            "$routeParams",
            "$q"
        ];

        constructor(
            private albumApi: AlbumApiService,
            private appNav: AppNavService,
            $routeParams: ng.route.IRouteParamsService,
            private $q: ng.IQService) {
            var albumId = "Albums/" + $routeParams["id"];

            this.albumApi.get(albumId)
                .then(result => this.albumLoaded(result));
        }

        albumLoaded(album: Album | null) {
            if (album) {
                this.album = album;
                var zanzHadNullBg = !this.album.backgroundColor;
                console.log('zanz', zanzHadNullBg);

                this.loadCanvasSafeAlbumArt()
                    .then(img => this.populateColorSwatches(img))
                    .then(() => {
                        if (zanzHadNullBg) {
                            var saveTask = this.save();
                            if (saveTask) {
                                saveTask.then(() => setTimeout(() => this.zanzFetchNullArt(), 10000));
                            }
                        }
                    });
            }
        }

        save(): ng.IPromise<Album> | null {
            if (this.album && !this.album.isSaving) {
                this.album.isSaving = true;
                var task = this.albumApi.save(this.album!);
                task
                    .then(result => this.album = result)
                    .finally(() => this.album!.isSaving = false);

                return task;
            }

            return null;
        }

        hexToRgbString(hex: string) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result && result.length >= 4) {
                return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
            }

            return "";
        }

        resetColorSwatches() {
            this.loadCanvasSafeAlbumArt()
                .then(img => this.populateColorSwatches(img));
        }

        populateColorSwatches(image: HTMLImageElement) {
            if (this.album) {
                var vibrant = new Vibrant(image, 64, 5);
                var swatches = vibrant.swatches();
                if (swatches) {
                    this.allAlbumSwatches = UploadAlbumController.getFriendlySwatches(swatches);

                    if (!this.album.backgroundColor) {
                        this.album.backgroundColor = (swatches.DarkVibrant || swatches.DarkMuted || Song.defaultSwatch).getHex();
                        this.album.foregroundColor = (swatches.LightVibrant || swatches.Vibrant || Song.defaultSwatch).getHex();
                        this.album.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Song.defaultSwatch).getBodyTextColor();
                        this.album.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Song.defaultSwatch).getHex();
                    }
                }
            }
        }

        loadCanvasSafeAlbumArt(): ng.IPromise<HTMLImageElement> {
            var deferred = this.$q.defer<HTMLImageElement>();
            var img = document.createElement("img");
            img.src = "/api/albums/art/imageOnDomain?imageUrl=" + encodeURIComponent(this.album!.albumArtUri);
            img.addEventListener("load", () => {
                deferred.resolve(img);
            });

            return deferred.promise;
        }





        zanzFetchNullArt() {
            this.albumApi.zanzFetchNullArt()
                .then(album => {
                    if (album) {
                        this.appNav.editAlbum(album.id);
                    }
                })
        }
    }

    App.controller("EditAlbumController", EditAlbumController);
}