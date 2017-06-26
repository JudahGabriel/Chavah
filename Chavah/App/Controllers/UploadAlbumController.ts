namespace BitShuva.Chavah {
    export class UploadAlbumController {

        albumName = "";
        songs: FilepickerInkBlob[] = [];
        isUploading = false;
        albumArt: FilepickerInkBlob | null = null;
        purchaseUrl = "";
        genre = "";
        allGenres = ["Messianic Jewish", "Hebrew Roots", "Jewish Christian", "Jewish", "Christian"];
        artist: Server.IArtist | null = null;
        allArtists: Server.IArtist[] = [];
        foreColor = Song.defaultSwatch.getBodyTextColor();
        backColor = Song.defaultSwatch.getHex();
        mutedColor = Song.defaultSwatch.getHex();
        textShadowColor = Song.defaultSwatch.getBodyTextColor();
        allAlbumSwatches: IAlbumSwatch[] = [];

        static filePickerKey = "AwdRIarCGT8COm0mkYX1Ez";

        static $inject = [
            "artistApi",
            "albumApi",
            "appNav",
            "$scope",
            "$sce"
        ];

        constructor(
            artistApi: ArtistApiService,
            private albumApi: AlbumApiService,
            private appNav: AppNavService,
            private $scope: ng.IScope,
            private $sce: ng.ISCEService) {
            artistApi.getAll().then(results => this.allArtists = results.items);
        }

        chooseSongs() {
            filepicker.setKey(UploadAlbumController.filePickerKey);
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

            // Order the songs according to file name. If named right, it should order them correctly.
            songs.sort((a, b) => a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0);

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

        moveSongUp(song: FilepickerInkBlob) {
            var currentIndex = this.songs.indexOf(song);
            if (currentIndex > 0) {
                var newIndex = currentIndex - 1;
                this.songs.splice(currentIndex, 1);
                this.songs.splice(newIndex, 0, song);
            }
        }

        moveSongDown(song: FilepickerInkBlob) {
            var currentIndex = this.songs.indexOf(song);
            if (currentIndex < (this.songs.length - 1)) {
                var newIndex = currentIndex + 1;
                this.songs.splice(currentIndex, 1);
                this.songs.splice(newIndex, 0, song);
            }
        }

        removeSong(song: FilepickerInkBlob) {
            var index = this.songs.indexOf(song);
            if (index >= 0) {
                this.songs.splice(index, 1);
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
                fileName: file["friendlyName"],
                address: file.url
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
            if (!this.albumArt || !this.albumArt.url) {
                throw new Error("Must have album art.");
            }

            if (!this.albumName) {
                throw new Error("Must have album name.");
            }

            if (!this.artist) {
                throw new Error("Must have an artist");
            }

            if (!this.isUploading) {             
                var album: Server.IAlbumUpload = {
                    albumArtUri: this.albumArt.url,
                    artist: this.artist.name,
                    backColor: this.backColor,
                    foreColor: this.foreColor,
                    genres: this.genre,
                    mutedColor: this.mutedColor,
                    name: this.albumName,
                    purchaseUrl: this.purchaseUrl,
                    songs: this.songs ? this.songs.map(UploadAlbumController.filePickerSongToAlbumSong) : [],
                    textShadowColor: this.textShadowColor
                };
                this.isUploading = true;
                this.albumApi.upload(album)
                    .then(albumId => this.appNav.editAlbum(album.artist, album.name))
                    .finally(() => this.isUploading = false);
            }
        }
    }

    App.controller("UploadAlbumController", UploadAlbumController);
}