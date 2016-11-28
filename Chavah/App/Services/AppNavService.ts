namespace BitShuva.Chavah {
    export class AppNavService {

        static $inject = [
            "$location",
            "$uibModal"
        ];

        constructor(
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
                controller: "RequestController as vm",
                templateUrl: "../Views/RequestSong.html"
            });

            return requestSongDialog;
        }
    }

    App.service("appNav", AppNavService);
}