namespace BitShuva.Chavah {
    export class AppNavService {

        static $inject = [
            "templatePaths",
            "$location",
            "$uibModal"
        ];

        constructor(
            private templatePaths: TemplatePaths,
            private $location: ng.ILocationService,
            private $uibModal: ng.ui.bootstrap.IModalService) {

        }

        signIn() {
            this.$location.url("/signin");
        }

        nowPlaying() {
            this.$location.url("/nowplaying");
        }

        register(attemptedEmail?: string) {
            if (attemptedEmail) {
                this.$location.url(`/register/${encodeURIComponent(attemptedEmail)}`)
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

        editAlbum(albumId: string) {
            this.$location.url(`/admin/${albumId}`);
        }

        showSongRequestDialog(): ng.ui.bootstrap.IModalServiceInstance {
            var requestSongDialog = this.$uibModal.open({
                controller: "RequestSongController as vm",
                templateUrl: this.templatePaths.songRequestModal,
                windowClass: "request-song-modal"
            });

            return requestSongDialog;
        }
    }

    App.service("appNav", AppNavService);
}