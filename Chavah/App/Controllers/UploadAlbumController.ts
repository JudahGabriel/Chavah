namespace BitShuva.Chavah {
    export class UploadAlbumController {

        albumName = "";
        songs: FilepickerInkBlob[] = [];
        isUploading = false;
        albumArt: FilepickerInkBlob = null;
        purchaseUrl = "";
        genre = "";
        allGenres = ["Messianic Jewish", "Hebrew Roots", "Jewish Christian", "Jewish", "Christian"];
        artist: Server.IArtist = null;
        allArtists: Server.IArtist[] = [];
        foreColor = Song.defaultSwatch.getBodyTextColor();
        backColor = Song.defaultSwatch.getHex();
        mutedColor = Song.defaultSwatch.getHex();
        textShadowColor = Song.defaultSwatch.getBodyTextColor();
        allAlbumSwatches: IAlbumSwatch[] = [];

        static filePickerKey = "AwdRIarCGT8COm0mkYX1Ez";

        static $inject = ["artistApi", "albumApi", "$scope", "$sce"];

        constructor(
            artistApi: ArtistApiService,
            private albumApi: AlbumApiService,
            private $scope: ng.IScope,
            private $sce: ng.ISCEService) {
            artistApi.getAll().then(results => this.allArtists = results.Items);
        }

        chooseSongs() {
            filepicker.setKey(UploadAlbumController.filePickerKey)
            var options: FilepickerMultipleFilePickOptions = {
                extension: ".mp3"
            };
            filepicker.pickMultiple(
                options,
                (results: FilepickerInkBlob[]) => this.songsChosen(results),
                (error) => console.log("Upload failed.", error));
        }

        songsChosen(songs: FilepickerInkBlob[]) {
            songs.forEach(s => {
                s["trustedUrl"] = this.$sce.trustAsResourceUrl(s.url);
                s["friendlyName"] = UploadAlbumController.songNameFromFileName(s.filename);
            });
            this.songs = this.songs.concat(songs);
            this.$scope.$applyAsync();
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
            this.albumArt = albumArt;
            this.fetchAlbumColorSwatches(albumArt);
            this.$scope.$applyAsync();
        }

        fetchAlbumColorSwatches(albumArt: FilepickerInkBlob) {
            if (albumArt.url) {
                var img = document.createElement("img");
                img.src = "/api/albums/art/imageOnDomain?imageUrl=" + encodeURIComponent(albumArt.url);
                img.addEventListener("load", () => {
                    var vibrant = new Vibrant(img, 64, 5);
                    var swatches = vibrant.swatches();
                    if (swatches) {
                        this.allAlbumSwatches = UploadAlbumController.getFriendlySwatches(swatches);
                        this.backColor = (swatches.DarkVibrant || swatches.DarkMuted || Song.defaultSwatch).getHex();
                        this.foreColor = (swatches.LightVibrant || swatches.Vibrant || Song.defaultSwatch).getHex();
                        this.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Song.defaultSwatch).getBodyTextColor();
                        this.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Song.defaultSwatch).getHex();
                        this.$scope.$applyAsync();
                    }
                });
            }
        }

        static songNameFromFileName(fileName: string): string {
            var songName = fileName;

            // Slice off the extension.
            var lastIndexOfDot = songName.lastIndexOf(".");
            if (lastIndexOfDot > 0) {
                songName = songName.substring(0, lastIndexOfDot);
            }

            // Slice off anything before " - "
            var lastIndexOfDash = songName.lastIndexOf(" - ");
            if (lastIndexOfDash >= 0) {
                songName = songName.substr(lastIndexOfDash + 3);
            }

            return songName;
        }

        static filePickerSongToAlbumSong(file: FilepickerInkBlob): Server.ISongUpload {
            return {
                FileName: file["friendlyName"],
                Address: file.url
            };
        }

        static getFriendlySwatches(rawSwatches: ISwatchList): IAlbumSwatch[] {            
            return Object.getOwnPropertyNames(rawSwatches)
                .filter(p => !!rawSwatches[p])
                .map(p => {
                    var swatch: ISwatch = rawSwatches[p];
                    var friendlySwatch: IAlbumSwatch = {
                        name: p,
                        color: swatch.getHex(),
                        titleTextColor: swatch.getTitleTextColor(),
                        bodyTextColor: swatch.getBodyTextColor()
                    };
                    return friendlySwatch;
                });
        }

        hexToRgbString(hex: string) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result && result.length >= 4) {
                return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
            }

            return "";
        }

        artistSelected(artist: Server.IArtist) {
            this.artist = angular.copy(artist);
        }

        upload() {
            if (!this.albumArt && !this.albumArt.url) {
                throw new Error("Must have album art.");
            }

            if (!this.albumName) {
                throw new Error("Must have album name.");
            }

            if (!this.isUploading) {             
                var album: Server.IAlbumUpload = {
                    AlbumArtUri: this.albumArt.url,
                    Artist: this.artist.Name,
                    BackColor: this.backColor,
                    ForeColor: this.foreColor,
                    Genres: this.genre,
                    MutedColor: this.mutedColor,
                    Name: this.albumName,
                    PurchaseUrl: this.purchaseUrl,
                    Songs: this.songs ? this.songs.map(UploadAlbumController.filePickerSongToAlbumSong) : [],
                    TextShadowColor: this.textShadowColor
                };
                this.isUploading = true;
                this.albumApi.upload(album)
                    .then(albumId => window.location.href = `#/${albumId}`)
                    .finally(() => this.isUploading = false);
            }
        }
    }

    App.controller("UploadAlbumController", UploadAlbumController);
}