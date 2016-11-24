namespace BitShuva.Chavah {
    export class PasswordController {

        readonly email = "";
        showPasswordError = false;
        isBusy = false;
        password = "";
        staySignedIn = true;
        signInSuccessful = false;

        static $inject = [
            "signInApi",
            "appNav",
            "$routeParams"
        ];

        constructor(
            private signInApi: SignInService,
            private appNav: AppNavService,
            $routeParams: ng.route.IRouteParamsService) {

            this.email = $routeParams["email"];
        }

        get isPasswordValid(): boolean {
            return this.password.length >= 6;
        }

        signIn() {
            if (!this.isPasswordValid) {
                this.showPasswordError = true;
                return;
            }

            if (!this.isBusy) {
                this.isBusy = true;
                this.signInApi.signIn(this.email, this.password, this.staySignedIn)
                    .then(result => this.signInCompleted(result))
                    .finally(() => this.isBusy = false);
            }
        }

        signInCompleted(result: SignInResult) {
            if (result.status === SignInStatus.Success) {
                this.appNav.nowPlaying();
            }
        }
    }

    App.controller("PasswordController", PasswordController);
}