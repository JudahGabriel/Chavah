namespace BitShuva.Chavah {
    export class PasswordController {

        readonly email = "";
        showPasswordError = false;
        passwordError = "";
        isBusy = false;
        password = "";
        staySignedIn = true;
        signInSuccessful = false;

        static $inject = [
            "accountApi",
            "appNav",
            "$routeParams",
            "$timeout",
            "$scope"
        ];

        constructor(
            private accountApi: AccountService,
            private appNav: AppNavService,
            $routeParams: ng.route.IRouteParamsService,
            private $timeout: ng.ITimeoutService,
            $scope: ng.IScope) {

            this.email = $routeParams["email"];
            $scope.$watch(() => this.password, () => this.passwordChanged());
        }

        get isPasswordValid(): boolean {
            return this.password.length >= 6;
        }

        signIn() {
            if (!this.isPasswordValid) {
                this.showPasswordError = true;
                this.passwordError = "Passwords must be at least 6 characters long.";
                return;
            }

            if (!this.isBusy) {
                this.isBusy = true;
                this.accountApi.signIn(this.email, this.password, this.staySignedIn)
                    .then(result => this.signInCompleted(result))
                    .finally(() => this.isBusy = false);
            }
        }

        signInCompleted(result: SignInResult) {
            if (result.status === SignInStatus.Success) {
                this.signInSuccessful = true;
                this.$timeout(() => this.appNav.nowPlaying(), 2000);
            } else if (result.status === SignInStatus.LockedOut) {
                this.showPasswordError = true;
                this.passwordError = "Your account is locked out. Please contact judahgabriel@gmail.com";
            } else if (result.status === SignInStatus.RequiresVerification) {
                this.showPasswordError = true;
                this.passwordError = "Please check your email. We've sent you an email with a link to confirm your account.";
            } else if (result.status === SignInStatus.Failure) {
                this.showPasswordError = true;
                this.passwordError = "Incorrect password";
            }
        }

        passwordChanged() {
            this.showPasswordError = false;
            this.passwordError = "";
        }
    }

    App.controller("PasswordController", PasswordController);
}