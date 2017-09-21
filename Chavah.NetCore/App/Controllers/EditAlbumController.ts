﻿namespace BitShuva.Chavah {
    export class EditAlbumController {

        album: Album | null = null;
        allAlbumSwatches: IAlbumSwatch[] = [];
        hasChangedAlbumArt = false;

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
            // - An album and artist: /#/admin/album/lamb/sacrifice
            // - An album ID: /#/admin/album/albums/221
            // - Nothing (will create a new album): /#/admin/album/create
            var artist = $routeParams["artist"] as string;
            var album = $routeParams["album"] as string;
            if (artist && album) {
                var isAlbumId = artist.toLowerCase() === "albums";
                if (isAlbumId) {
                    this.albumApi.get(`${artist}/${album}`)
                        .then(result => this.albumLoaded(result));
                } else {
                    this.albumApi.getByArtistAndAlbumName(artist, album)
                        .then(result => this.albumLoaded(result));
                }
            } else {
                this.createNewAlbum();
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
                textShadowColor: "",
                songCount: 0
            });
        }

        albumLoaded(album: Album | null) {
            if (album) {
                this.album = album;

                if (album.albumArtUri) {
                    this.loadCanvasSafeAlbumArt(album.albumArtUri)
                        .then(img => this.populateColorSwatches(img));
                }
            } else {
                this.appNav.createAlbum();
            }
        }
        
        save() {
            if (this.album && !this.album.isSaving) {
                this.album.isSaving = true;
                var task: ng.IPromise<Album>;
                if (this.hasChangedAlbumArt) {
                    // We must .save first to ensure we have an album ID.
                    this.albumApi.save(this.album)
                        .then(result => this.albumApi.changeArt(result.id, this.album!.albumArtUri!))
                        .then(result => {
                            this.album = result;
                            this.hasChangedAlbumArt = false;
                        })
                        .finally(() => this.album!.isSaving = false);
                } else {
                    this.albumApi.save(this.album)
                        .then(result => this.album = result)
                        .finally(() => this.album!.isSaving = false);
                }
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

        resetColorSwatches(imgUrl: string) {
            this.loadCanvasSafeAlbumArt(imgUrl)
                .then(img => this.populateColorSwatches(img));
        }

        chooseAlbumArt() {
            filepicker.setKey(UploadAlbumController.filePickerKey)
            var options: FilepickerMultipleFilePickOptions = {
                extensions: [".jpg", ".png"]
            };
            filepicker.pick(
                options,
                (result: FilepickerInkBlob) => this.albumArtChosen(result),
                (error) => console.log("Album art pick failed.", error));
        }

        albumArtChosen(albumArt: FilepickerInkBlob) {
            this.hasChangedAlbumArt = true;
            if (this.album) {
                this.album.albumArtUri = albumArt.url;
            }
            this.loadCanvasSafeAlbumArt(albumArt.url)
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

        loadCanvasSafeAlbumArt(imgUrl: string): ng.IPromise<HTMLImageElement> {
            if (!imgUrl) {
                throw new Error("imgUrl must not be null or undefined");
            }

            var deferred = this.$q.defer<HTMLImageElement>();
            var img = document.createElement("img");
            img.src = "/api/albums/art/imageOnDomain?imageUrl=" + encodeURIComponent(imgUrl);
            img.addEventListener("load", () => {
                deferred.resolve(img);
            });
            img.addEventListener("error", () => deferred.reject());
                     
            return deferred.promise;
        }
    }

    App.controller("EditAlbumController", EditAlbumController);
}