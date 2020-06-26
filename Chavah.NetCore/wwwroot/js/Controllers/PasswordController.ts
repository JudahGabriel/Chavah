namespace BitShuva.Chavah {
    export class PasswordController {
        
        readonly email = "";
        profilePic: string | null = null;
        showPasswordError = false;
        passwordError = "";
        isBusy = false;
        password = "";
        staySignedIn = true;
        signInSuccessful = false;
        showResendConfirmEmail = false;
        sendConfirmationEmailState: "none" | "sending" | "sent" = "none";

        static $inject = [
            "accountApi",
            "appNav",
            "userApi",
            "$routeParams",
            "$timeout",
            "$scope",
        ];

        constructor(
            private accountApi: AccountService,
            private appNav: AppNavService,
            private userApi: UserApiService,
            $routeParams: ng.route.IRouteParamsService,
            private $timeout: ng.ITimeoutService,
            $scope: ng.IScope) {

            this.email = $routeParams["email"];
            $scope.$watch(() => this.password, () => this.passwordChanged());
        }

        get isPasswordValid(): boolean {
            return this.password.length >= 6;
        }

        $onInit() {
            this.appNav.goBackUrl = "#/signin";
            // Fetch the profile picture for this user.
            this.userApi.getProfilePicForEmailAddress(this.email)
                .then(results => this.profilePic = results);
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
                    .then(result => this.signInCompleted(result), error => this.signInErred(error))
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
                this.showResendConfirmEmail = true;
            } else if (result.status === SignInStatus.Failure) {
                this.showPasswordError = true;
                this.passwordError = "Incorrect password";
            } else if (result.status === SignInStatus.Pwned) {
                this.showPasswordError = true;
                this.passwordError = result.errorMessage || "Select a different password because the password you chose has appeared in a data breach";
                this.$timeout(() => this.appNav.resetPwnedPassword(this.email), 4000);
            }
        }

        signInErred(error: any) {
            this.showPasswordError = true;
            this.passwordError = "There was a problem signing in. If the problem keeps happening, email us: chavah@messianicradio.com. Error details: " + (error && error.toString ? error.toString() : "[null]");
        }

        passwordChanged() {
            this.showPasswordError = false;
            this.passwordError = "";
        }

        sendConfirmationEmail() {
            this.sendConfirmationEmailState = "sending";
            this.accountApi.resendConfirmationEmail(this.email)
                .then(() => this.sendConfirmationEmailState = "sent");
        }
    }

    export class SignInModel implements Server.ISignInModel {
        email: string;
        password: string;
        staySignedIn: boolean;
    }

    App.controller("PasswordController", PasswordController);
}
