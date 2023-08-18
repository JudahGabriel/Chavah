
namespace BitShuva.Chavah {
    declare var Vibrant;
    export class UploadAlbumController {
        albumName = "";
        artistName = "";
        albumHebrewName: string | null = null;
        songs: MediaFileUpload[] = [];
        isSaving = false;
        albumArt: MediaFileUpload | null = null;
        purchaseUrl = "";
        genre = "";
        uploadError: string | null = null;
        allGenres = ["Messianic Jewish", "Hebrew Roots", "Jewish Christian", "Jewish", "Christian"];
        foreColor = Song.defaultSwatch.getBodyTextColor();
        backColor = Song.defaultSwatch.getHex();
        mutedColor = Song.defaultSwatch.getHex();
        textShadowColor = Song.defaultSwatch.getBodyTextColor();
        allAlbumSwatches: IAlbumSwatch[] = [];

        static $inject = [
            "albumApi",
            "appNav",
            "$scope",
            "$q"
        ];

        constructor(
            private albumApi: AlbumApiService,
            private appNav: AppNavService,
            private $scope: ng.IScope,
            private $q: ng.IQService) {
        }

        get isUploadingMediaFiles(): boolean {
            return this.songs.some(a => a.status === "uploading");
        }

        get anySongsFailedToUpload(): boolean {
            return this.songs.some(a => a.status === "failed")
        }

        chooseSongs() {
            $("#chooseMp3sInput").click();
        }

        chooseAlbumArt() {
            $("#chooseAlbumArtInput").click();
        }

        async songsChosen(e: JQueryEventObject) {
            const fileInput = e.target as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                this.addFilesToUploadQueue(Array.from(fileInput.files));
                this.$scope.$applyAsync();
            }            
        }

        async albumArtChosen(e: JQueryEventObject) {
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

        albumArtUploadSucceeded(albumArt: MediaFileUpload, tempFile: Server.TempFile) {
            this.markUploadAsCompleted(albumArt, tempFile);
            this.reloadAlbumColorSwatches(tempFile.url);
        }

        albumArtUploadFailed(albumArt: MediaFileUpload, error: unknown) {
            this.markUploadAsFailed(albumArt, error);
        }

        addFilesToUploadQueue(files: File[]) {
            const fileUploads = files
                .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
                .map((file) => this.createMediaFileUpload(file));
            this.songs.push(...fileUploads);
            this.processFileUploads();
        }

        createMediaFileUpload(file: File): MediaFileUpload {
            return {
                file: file,
                name: UploadAlbumController.songNameFromFileName(file.name),
                error: null,
                url: null,
                status: "queued",
                id: null
            };
        }

        processFileUploads() {
            const nextQueuedSong = this.songs.find(s => s.status === "queued");
            if (nextQueuedSong) {
                nextQueuedSong.status = "uploading";
                this.albumApi.uploadTempFile(nextQueuedSong.file)
                    .then(tempFile => this.songUploadSucceeded(nextQueuedSong, tempFile))
                    .catch(error => this.songUploadFailed(nextQueuedSong, error))
                    .finally(() => this.processFileUploads());
            }
        }

        songUploadSucceeded(upload: MediaFileUpload, tempFile: Server.TempFile) {
            this.markUploadAsCompleted(upload, tempFile);
        }

        songUploadFailed(upload: MediaFileUpload, error: any) {
            this.markUploadAsFailed(upload, error);
        }

        markUploadAsCompleted(upload: MediaFileUpload, tempFile: Server.TempFile) {
            upload.status = "completed";
            upload.url = tempFile.url;
            upload.id = tempFile.id;
            upload.error = null;
        }

        markUploadAsFailed(upload: MediaFileUpload, error: unknown) {
            upload.status = "failed";
            upload.url = null;
            upload.error = JSON.stringify(error || "failed to upload file");
        }

        async reloadAlbumColorSwatches(albumArtUri: string) {
            const swatches = await this.fetchAlbumColorSwatches(albumArtUri);
            if (swatches) {
                this.allAlbumSwatches = UploadAlbumController.getFriendlySwatches(swatches);
                this.backColor = (swatches.DarkVibrant || swatches.DarkMuted || Song.defaultSwatch).getHex();
                this.foreColor = (swatches.LightVibrant || swatches.Vibrant || Song.defaultSwatch).getHex();
                this.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Song.defaultSwatch).getBodyTextColor();
                this.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Song.defaultSwatch).getHex();
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

        moveSongUp(song: MediaFileUpload) {
            let currentIndex = this.songs.indexOf(song);
            if (currentIndex > 0) {
                let newIndex = currentIndex - 1;
                this.songs.splice(currentIndex, 1);
                this.songs.splice(newIndex, 0, song);
            }
        }

        moveSongDown(song: MediaFileUpload) {
            const currentIndex = this.songs.indexOf(song);
            if (currentIndex < (this.songs.length - 1)) {
                const newIndex = currentIndex + 1;
                this.songs.splice(currentIndex, 1);
                this.songs.splice(newIndex, 0, song);
            }
        }

        removeSong(song: MediaFileUpload) {
            const index = this.songs.indexOf(song);
            if (index >= 0) {
                this.songs.splice(index, 1);
            }
        }

        hexToRgbString(hex: string) {
            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result && result.length >= 4) {
                return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
            }

            return "";
        }

        upload() {
            this.uploadError = null;

            if (!this.albumArt || !this.albumArt.url) {
                this.uploadError = "Must have album art.";
                return;
            }

            if (!this.albumName) {
                this.uploadError = "Must have album name.";
                return;
            }

            if (!this.artistName) {
                this.uploadError = "Must have an artist";
                return;
            }

            if (this.isUploadingMediaFiles) {
                this.uploadError = "Song upload is still progress";
                return;
            }

            if (this.songs.some(s => !s.url || !s.id)) {
                this.uploadError = "Some songs haven't finished uploading";
                return;
            }

            if (!this.isSaving) {
                let album: Server.AlbumUpload = {
                    albumArt: UploadAlbumController.mediaUploadToTempFile(this.albumArt),
                    artist: this.artistName,
                    backColor: this.backColor,
                    foreColor: this.foreColor,
                    genres: this.genre,
                    mutedColor: this.mutedColor,
                    name: this.albumName,
                    hebrewName: this.albumHebrewName,
                    purchaseUrl: this.purchaseUrl,
                    songs: this.songs ? this.songs.map(UploadAlbumController.mediaUploadToTempFile) : [],
                    textShadowColor: this.textShadowColor,
                };
                this.isSaving = true;
                this.albumApi.upload(album)
                    .then(albumId => this.appNav.editAlbum(album.artist, album.name))
                    .finally(() => this.isSaving = false);
            }
        }

        static songNameFromFileName(fileName: string): string {
            let songName = fileName;

            // Slice off the extension.
            let lastIndexOfDot = songName.lastIndexOf(".");
            if (lastIndexOfDot > 0) {
                songName = songName.substring(0, lastIndexOfDot);
            }

            // Slice off anything before " - "
            let lastIndexOfDash = songName.lastIndexOf(" - ");
            if (lastIndexOfDash >= 0) {
                songName = songName.substr(lastIndexOfDash + 3);
            }

            return songName;
        }

        static mediaUploadToTempFile(file: MediaFileUpload): Server.TempFile {
            if (!file.id) {
                throw new Error(`Media file ${file.name} hasn't been uploaded`);
            }

            return {
                name: file.name,
                url: file.url!,
                id: file.id
            };
        }

        static getFriendlySwatches(rawSwatches: any /*ISwatchList*/): IAlbumSwatch[] {
            return Object.getOwnPropertyNames(rawSwatches)
                .filter(p => !!rawSwatches[p])
                .map(p => {
                    let swatch = rawSwatches[p];
                    let friendlySwatch: IAlbumSwatch = {
                        name: p,
                        color: swatch.getHex(),
                        titleTextColor: swatch.getTitleTextColor(),
                        bodyTextColor: swatch.getBodyTextColor(),
                    };
                    return friendlySwatch;
                });
        }
    }

    App.controller("UploadAlbumController", UploadAlbumController);
}
