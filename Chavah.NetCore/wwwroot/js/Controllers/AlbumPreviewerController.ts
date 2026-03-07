namespace BitShuva.Chavah {
    declare var Vibrant;

    export class AlbumPreviewerController {

        albumArt: MediaFileUpload | null = null;
        foreColor = Song.defaultSwatch.getBodyTextColor();
        backColor = Song.defaultSwatch.getHex();
        mutedColor = Song.defaultSwatch.getHex();
        textShadowColor = Song.defaultSwatch.getBodyTextColor();
        artistName = "Artist Name";
        albumName = "Album Name";
        allAlbumSwatches: IAlbumSwatch[] = [];

        static $inject = [
            "albumApi",
            "$scope",
            "$q"
        ];

        constructor(private albumApi: AlbumApiService, private $scope: ng.IScope, private $q: ng.IQService) {
            // Listen for album art changes from parent controller
            $scope.$on("album-art-changed", (_, albumArt: MediaFileUpload) => {
                this.albumArt = albumArt;
                if (albumArt && albumArt.url) {
                    this.reloadAlbumColorSwatches(albumArt.url);
                }
            });
        }

        chooseAlbumArt(): void {
            $("#chooseAlbumArtInput").click();
        }

        async albumArtChosen(e: UIEvent) {
            const fileInput = e.target as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files.length === 1) {
                const file = fileInput.files[0];
                const fileUpload = this.createMediaFileUpload(file);
                fileUpload.status = "uploading";
                this.albumArt = fileUpload;
                this.albumApi.uploadTempFile(file)
                    .then(tempFile => this.albumArtUploadSucceeded(fileUpload, tempFile))
                    .catch(error => this.albumArtUploadFailed(fileUpload, error));
            }

            this.$scope.$applyAsync();
        }

        resetAlbumColors(): void {
            if (this.albumArt && this.albumArt.url) {
                this.reloadAlbumColorSwatches(this.albumArt?.url);
            }
        }

        createMediaFileUpload(file: File): MediaFileUpload {
            return {
                file: file,
                name: UploadAlbumController.songNameFromFileName(file.name),
                error: null,
                url: null,
                status: "queued",
                id: null,
                cdnId: null
            };
        }

        hexToRgbString(hex: string) {
            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result && result.length >= 4) {
                return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
            }

            return "";
        }

        albumArtUploadSucceeded(albumArt: MediaFileUpload, tempFile: Server.TempFile) {
            this.markUploadAsCompleted(albumArt, tempFile);
            this.reloadAlbumColorSwatches(tempFile.url);
            this.$scope.$emit("album-art-changed", tempFile); // raise the album-art-changed event.
        }

        albumArtUploadFailed(albumArt: MediaFileUpload, error: unknown) {
            this.markUploadAsFailed(albumArt, error);
        }

        markUploadAsCompleted(upload: MediaFileUpload, tempFile: Server.TempFile) {
            upload.status = "completed";
            upload.url = tempFile.url;
            upload.cdnId = tempFile.cdnId;
            upload.id = tempFile.id;
            upload.error = null;
        }

        markUploadAsFailed(upload: MediaFileUpload, error: unknown) {
            upload.status = "failed";
            upload.url = null;
            upload.error = JSON.stringify(error || "failed to upload file");
        }

        selectSwatch(selection: "fore" | "back" | "muted" | "shadow", color: string): void {
            switch (selection) {
                case "fore": this.foreColor = color; break;
                case "back": this.backColor = color; break;
                case "muted": this.mutedColor = color; break;
                case "shadow": this.textShadowColor = color; break;
            }

            this.albumColorChanged();
        }

        async reloadAlbumColorSwatches(albumArtUri: string) {
            const swatches = await this.fetchAlbumColorSwatches(albumArtUri);
            if (swatches) {
                this.allAlbumSwatches = UploadAlbumController.getFriendlySwatches(swatches);
                this.backColor = (swatches.DarkVibrant || swatches.DarkMuted || Song.defaultSwatch).getHex();
                this.foreColor = (swatches.LightVibrant || swatches.Vibrant || Song.defaultSwatch).getHex();
                this.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Song.defaultSwatch).getBodyTextColor();
                this.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Song.defaultSwatch).getHex();
                this.albumColorChanged();
            }
        }

        fetchAlbumColorSwatches(imageUrl: string): ng.IPromise<any /*ISwatchList*/> {
            const img = document.createElement("img");
            const deferred = this.$q.defer<any /*ISwatchList*/>();
            img.crossOrigin = "Anonymous";
            //img.src = imageUrl;
            img.src = "/api/albums/imageOnDomain?imageUrl=" + encodeURIComponent(imageUrl);
            img.addEventListener("load", () => {
                const vibrant = new Vibrant(img, 64, 5);
                const swatches = vibrant.swatches();
                deferred.resolve(swatches);
            }, { once: true });
            img.addEventListener("error", error => deferred.reject(error), { once: true });
            return deferred.promise;
        }

        albumColorChanged(): void {
            const e: Server.AlbumColors = {
                foreground: this.foreColor,
                background: this.backColor,
                muted: this.mutedColor,
                textShadow: this.textShadowColor,
            };
            this.$scope.$emit("album-colors-changed", e);
        }
    }

    App.controller("AlbumPreviewerController", AlbumPreviewerController);
}
