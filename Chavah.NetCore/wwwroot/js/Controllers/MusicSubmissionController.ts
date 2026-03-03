namespace BitShuva.Chavah {

    export class MusicSubmissionController {

        artist = "";
        album = "";
        enrollInMessiahsMusicFund = false;
        email = "";
        payPalEmail = "";
        purchaseUrl = "";
        songs: MediaFileUpload[] = [];
        albumArt: MediaFileUpload | null = null;
        submissionState: "default" | "saving" | "error" | "complete" = "default";

        static $inject = [
            "albumApi",
            "$q",
        ];

        constructor(private readonly albumApi: AlbumApiService, private readonly q: ng.IQService) {
        }

        albumArtChanged(e: UIEvent): void {
            const albumArtInput = e.target as HTMLInputElement;
            const file = albumArtInput.files?.item(0);
            if (file) {
                this.albumArt = {
                    name: file.name,
                    file: file,
                    error: null,
                    id: null,
                    cdnId: null,
                    status: "queued",
                    url: null
                };
            }

            if (this.albumArt) {
                albumArtInput.setCustomValidity(""); // clear any "you need to choose album art" validation errors.
            }
        }

        mp3sChanged(e: UIEvent): void {
            const input = e.target as HTMLInputElement;
            const files = input.files;
            if (files) {
                this.songs.push(...Array.from(files).map(f => this.createSongFile(f)));
                this.songs.every(s => s.name = s.name);
                this.songs = [...this.songs];
            }

            if (this.songs.length > 0) {
                input.setCustomValidity(""); // clear any validation error message
            }
        }

        moveSongUp(song: MediaFileUpload): void {
            const songIndex = this.songs.indexOf(song);
            if (songIndex !== -1 && songIndex > 0) {
                // Move the song up in the songs array.
                const temp = this.songs[songIndex - 1];
                this.songs[songIndex - 1] = this.songs[songIndex];
                this.songs[songIndex] = temp;
                this.songs = [...this.songs];
            }
        }

        moveSongDown(song: MediaFileUpload): void {
            const songIndex = this.songs.indexOf(song);
            if (songIndex !== -1 && songIndex < this.songs.length - 1) {
                // Move the song down in the songs array.
                const temp = this.songs[songIndex + 1];
                this.songs[songIndex + 1] = this.songs[songIndex];
                this.songs[songIndex] = temp;
                this.songs = [...this.songs];
            }
        }

        removeSong(song: MediaFileUpload): void {
            const songIndex = this.songs.indexOf(song);
            if (songIndex !== -1) {
                this.songs.splice(songIndex, 1);
                this.songs = [...this.songs];
            }
        }

        createSongFile(file: File): MediaFileUpload {
            const indexOfDot = file.name.lastIndexOf(".");
            let songName = file.name;
            if (indexOfDot !== -1) {
                songName = file.name.substring(0, indexOfDot);
            }

            return {
                name: songName,
                file: file,
                error: null,
                id: null,
                cdnId: null,
                status: "queued",
                url: null
            };
        }

        uploadMp3sAndAlbumArt(): ng.IPromise<any> {
            if (!this.albumArt) {
                return this.q.reject("Album art must not be null.");
            }
            if (this.songs.length === 0) {
                return this.q.reject("Must have at least one song.");
            }

            const mediaUploadTasks = this.songs.concat([this.albumArt])
                .filter(s => !s.url)
                .map(s => this.uploadTempFile(s));
            return this.q.all(mediaUploadTasks);
        }

        uploadTempFile(mediaFile: MediaFileUpload): ng.IPromise<void> {
            return this.albumApi.uploadTempFile(mediaFile.file)
                .then(tempFile => {
                    mediaFile.id = tempFile.id;
                    mediaFile.cdnId = tempFile.cdnId;
                    mediaFile.url = tempFile.url;
                });
        }

        static mediaFileToTempFile(mediaFile: MediaFileUpload): Server.TempFile {
            return {
                id: mediaFile.id || "",
                cdnId: mediaFile.cdnId,
                url: mediaFile.url || "",
                name: mediaFile.name,
                createdAt: new Date().toISOString(),
            };
        }

        postSubmission(): ng.IPromise<string> {
            if (!this.albumArt) {
                throw new Error("Album art must not be null.");
            }

            if (this.songs.length === 0) {
                throw new Error("Must have at least one song.");
            }

            const album: Server.AlbumSubmissionByArtist = {
                artistEmail: this.email,
                artistPayPalEmail: this.payPalEmail,
                name: this.album,
                hebrewName: null,
                artist: this.artist,
                albumArt: MusicSubmissionController.mediaFileToTempFile(this.albumArt),
                backColor: "#000000",
                foreColor: "#FFFFFF",
                mutedColor: "#000000",
                textShadowColor: "#000000",
                genres: "",
                purchaseUrl: this.purchaseUrl,
                songs: this.songs.map(MusicSubmissionController.mediaFileToTempFile)
            }
            return this.albumApi.uploadAlbumSubmissionByArtist(album);
        }

        submit(e: UIEvent): void {
            // Invalidate the album art input if we have no album art. This will make the input have the :invalid pseudo state.
            if (!this.albumArt) {
                const albumInput = document.querySelector(".music-submission-page #albumArt") as HTMLInputElement;
                if (albumInput) {
                    albumInput.setCustomValidity("Please upload your album art.");
                }
            }

            // Invalidate the songs file input if we have no songs. This will make the input have the :invalid pseudo state.
            if (this.songs.length === 0) {
                const songInput = document.querySelector(".music-submission-page #songFiles") as HTMLInputElement;
                if (songInput) {
                    songInput.setCustomValidity("You must upload at least one song.");
                }
            }

            // Are there any invalid inputs? Make the first one visible.
            const invalidInput = document.querySelector(".music-submission-page input:invalid");
            if (invalidInput) {
                invalidInput.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "start"
                });
                e.preventDefault();
                return;
            }

            this.submissionState = "saving";
            this.uploadMp3sAndAlbumArt()
                .then(() => this.postSubmission())
                .then(() => this.submissionState = "complete")
                .catch(error => {
                    console.error("Music submission failed due to an error.", error);
                    this.submissionState = "error";
                });
        }
    }

    App.controller("MusicSubmissionController", MusicSubmissionController);
}
