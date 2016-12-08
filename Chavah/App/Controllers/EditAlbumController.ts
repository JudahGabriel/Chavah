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

            // We allow the user to pass in:
            // -an album ID (Albums/777) 
            // -an artist/ album combo (Lamb | The Sacrifice)
            // -nothing (create new album)
            var albumId = $routeParams["id"];
            if (albumId === "new") {
                this.album = this.createNewAlbum();
            } else {
                var isArtistAlbum = albumId.indexOf("|") > 0;
                if (isArtistAlbum) {
                    var artistAndAlbum = albumId.split("|");
                    var artist = artistAndAlbum
                    this.albumApi.getByArtistAndAlbumName(artistAndAlbum[0], artistAndAlbum[1])
                        .then(result => this.albumLoaded(result));
                } else {
                    // We're passed in an actual album ID
                    this.albumApi.get("Albums/" + albumId)
                        .then(result => this.albumLoaded(result));
                }
            }
        }

        createNewAlbum(): Album {
            return new Album({
                albumArtUri: "",
                artist: "[new artist]",
                isVariousArtists: false,
                backgroundColor: "",
                foregroundColor: "",
                mutedColor: "",
                name: "[new album]",
                id: "",
                textShadowColor: ""
            });
        }

        albumLoaded(album: Album | null) {
            if (album) {
                this.album = album;                
                this.loadCanvasSafeAlbumArt()
                    .then(img => this.populateColorSwatches(img));
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
            img.addEventListener("error", () => deferred.reject());

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