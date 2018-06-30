namespace BitShuva.Chavah {
    export class AppNavService {
        
        static $inject = [
            "templatePaths",
            "$location",
            "$uibModal",
            "initConfig",
        ];

        readonly promptSignInUrl = "#/promptsignin";

        constructor(
            private templatePaths: ITemplatePaths,
            private $location: ng.ILocationService,
            private $uibModal: ng.ui.bootstrap.IModalService,
            private initConfig: Server.HomeViewModel) {
        }

        signIn() {
            this.$location.url("/signin");
        }

        signOut() {
            this.$location.url("/nowplaying");
            window.location.reload();
        }

        nowPlaying() {
            this.$location.url("/nowplaying");
        }

        promptSignIn() {
            this.$location.url(this.promptSignInUrl.replace("#", ""));
        }

        register(attemptedEmail?: string) {
            if (attemptedEmail) {
                this.$location.url(`/register/${encodeURIComponent(attemptedEmail)}`);
            } else {
                this.$location.url("/register");
            }
        }

        createPassword(email: string) {
            this.$location.url(`/createpassword/${encodeURIComponent(email)}`);
        }

        password(email: string) {
            this.$location.url(`/password/${encodeURIComponent(email)}`);
        }

        editAlbumById(albumId: string) {
            this.$location.url("/admin/album/" + albumId);
        }

        editAlbum(artist: string, album: string) {
            let escapedArtist = encodeURIComponent(artist);
            let escapedAlbum = encodeURIComponent(album);
            this.$location.url(`/admin/album/${escapedArtist}/${escapedAlbum}`);
        }

        getEditSongUrl(songId: string): string {
            return `/edit/${songId}`;
        }

        showSongRequestDialog(): ng.ui.bootstrap.IModalServiceInstance {
            let requestSongDialog = this.$uibModal.open({
                controller: "RequestSongController as vm",
                templateUrl: this.templatePaths.songRequestModal,
                windowClass: "request-song-modal",
            });

            return requestSongDialog;
        }

        createAlbum() {
            this.$location.url("/admin/album/create");
        }

        /**
         * Gets the client-side query parameters, returned as an object map.
         */
        getQueryParams(): any {
            return this.$location.search();
        }
    }

    App.service("appNav", AppNavService);
}
