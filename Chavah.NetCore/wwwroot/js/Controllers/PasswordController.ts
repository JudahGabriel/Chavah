namespace BitShuva.Chavah {
    export class PasswordController {

        static $inject = [
            "accountApi",
            "appNav",
            "$routeParams",
            "$timeout",
            "$scope",
        ];

        readonly email = "";
        showPasswordError = false;
        passwordError = "";
        isBusy = false;
        password = "";
        staySignedIn = true;
        signInSuccessful = false;

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
                var signInModel = new SignInModel();
                signInModel.email = this.email;
                signInModel.password = this.password;
                signInModel.staySignedIn = this.staySignedIn;

                this.accountApi.signIn(signInModel)
                    .then(result => this.signInCompleted(result))
                    .finally(() => this.isBusy = false);
            }
        }

        signInCompleted(result: Server.ISignInResult) {
            if (result.status === SignInStatus.Success) {
                this.signInSuccessful = true;
                this.$timeout(() => this.appNav.nowPlaying(), 2000);
            } else if (result.status === SignInStatus.LockedOut) {
                this.showPasswordError = true;
                this.passwordError = "Your account is locked out. Please contact judahgabriel@gmail.com";
            } else if (result.status === SignInStatus.RequiresVerification) {
                this.showPasswordError = true;
                // tslint:disable-next-line:max-line-length
                this.passwordError = "Please check your email. We've sent you an email with a link to confirm your account.";
            } else if (result.status === SignInStatus.Failure) {
                this.showPasswordError = true;
                this.passwordError = "Incorrect password";
            } else if (result.status === SignInStatus.Pwned) {
                this.showPasswordError = true;
                this.passwordError = result.errorMessage || "Select a different password because the password you chose has appeared in a data breach";
                this.$timeout(() => this.appNav.resetPwnedPassword(this.email), 4000);
            }
        }

        passwordChanged() {
            this.showPasswordError = false;
            this.passwordError = "";
        }
    }

    export class SignInModel implements Server.ISignInModel {
        email: string;
        password: string;
        staySignedIn: boolean;
    }

    App.controller("PasswordController", PasswordController);
}
