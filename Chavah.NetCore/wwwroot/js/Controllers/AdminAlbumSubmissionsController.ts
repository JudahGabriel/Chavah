namespace BitShuva.Chavah {
    export class AdminAlbumSubmissionsController {

        currentAlbum: Server.AlbumSubmissionByArtist | null = null;
        submissions: Server.AlbumSubmissionByArtist[] = [];
        hasLoaded = false;
        isSaving = false;
        errorMessage = "";

        static $inject = [
            "albumApi",
            "$scope",
        ];

        constructor(private readonly albumApi: AlbumApiService, private readonly $scope: ng.IScope) {
            albumApi.getSubmissions()
                .then(submissions => this.submissions = submissions)
                .finally(() => this.hasLoaded = true);

            // If the child AlbumPreviewerController changes the album art, we gotta know about it.
            $scope.$on("album-art-changed", (e, art: Server.TempFile | null) => this.albumArtChanged(e, art));

            // If the child AlbumPreviewerController changes the album colors, we gotta know about that too.
            $scope.$on("album-colors-changed", (e, colors: Server.AlbumColors | null) => this.albumColorsChanged(e, colors));
        }

        setCurrentAlbum(album: Server.AlbumSubmissionByArtist): void {
            this.currentAlbum = album;

            // Broadcast the change to child AlbumPreviewerController so it can change its colors and album art.
            if (this.currentAlbum && this.currentAlbum.albumArt) {
                const selectedAlbumArt = this.getAlbumArtForPreviewer(this.currentAlbum);
                this.$scope.$broadcast("album-art-changed", selectedAlbumArt);
            }
        }

        getAlbumArtForPreviewer(album: Server.AlbumSubmissionByArtist): MediaFileUpload | null {
            if (!album.albumArt) {
                return null;
            }

            return {
                name: album.albumArt.name,
                file: null as any,
                error: null,
                id: album.albumArt.id,
                cdnId: album.albumArt.cdnId,
                status: "completed",
                url: album.albumArt.url
            };
        }

        moveSongUp(song: Server.TempFile): void {
            if (this.currentAlbum) {
                const songIndex = this.currentAlbum.songs.indexOf(song);
                if (songIndex > 0) {
                    const temp = this.currentAlbum.songs[songIndex - 1];
                    this.currentAlbum.songs[songIndex - 1] = this.currentAlbum.songs[songIndex];
                    this.currentAlbum.songs[songIndex] = temp;
                    this.$scope.$applyAsync();
                }
            }
        }

        moveSongDown(song: Server.TempFile): void {
            if (this.currentAlbum) {
                const songIndex = this.currentAlbum.songs.indexOf(song);
                if (songIndex !== -1 && songIndex < this.currentAlbum.songs.length - 1) {
                    const below = this.currentAlbum.songs[songIndex + 1];
                    this.currentAlbum.songs[songIndex + 1] = this.currentAlbum.songs[songIndex];
                    this.currentAlbum.songs[songIndex] = below;
                    this.$scope.$applyAsync();
                }
            }
        }

        removeSong(song: Server.TempFile): void {
            if (this.currentAlbum) {
                const songIndex = this.currentAlbum.songs.indexOf(song);
                if (songIndex !== -1) {
                    this.currentAlbum.songs.splice(songIndex, 1);
                    this.$scope.$applyAsync();
                }
            }
        }

        albumArtChanged(e: angular.IAngularEvent, albumArt: Server.TempFile | null): void {
            if (albumArt && this.currentAlbum) {
                this.currentAlbum.albumArt = albumArt;
            }
        }

        removeSubmissionFromList(album: Server.AlbumSubmissionByArtist): void {
            const index = this.submissions.indexOf(album);
            if (index !== -1) {
                this.submissions.splice(index, 1);
                if (this.currentAlbum === album) {
                    this.setCurrentAlbum(this.submissions[0] || null);
                }
            }

            // Scroll the user back to the top of the list, since the current album they were looking at might have been removed.
            const submissionList = document.querySelector(".submissions-list");
            submissionList?.scrollIntoView({ behavior: "smooth" });
        }

        albumColorsChanged(e: angular.IAngularEvent, colors: Server.AlbumColors | null): void {
            if (colors && this.currentAlbum) {
                this.currentAlbum.backColor = colors.background;
                this.currentAlbum.foreColor = colors.foreground;
                this.currentAlbum.mutedColor = colors.muted;
                this.currentAlbum.textShadowColor = colors.textShadow;
            }
        }

        approve(): void {
            const album = this.currentAlbum;
            if (this.isSaving || !album) {
                return;
            }

            this.isSaving = true;
            this.errorMessage = "";
            this.albumApi.approveAlbumSubmission(album)
                .then(() => this.removeSubmissionFromList(album))
                .catch(error => this.errorMessage = `Failed to approve album submission: ${error}`)
                .finally(() => this.isSaving = false);
        }

        reject(): void {
            const album = this.currentAlbum;
            if (this.isSaving || !album) {
                return;
            }

            this.isSaving = true;
            this.errorMessage = "";
            this.albumApi.rejectAlbumSubmission(album)
                .then(() => this.removeSubmissionFromList(album))
                .catch(error => this.errorMessage = `Failed to reject album submission: ${error}`)
                .finally(() => this.isSaving = false);
        }
    }

    App.controller("AdminAlbumSubmissionsController", AdminAlbumSubmissionsController);
}
