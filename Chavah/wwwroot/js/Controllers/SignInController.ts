namespace BitShuva.Chavah {
    export class SignInController {

        static $inject = [
            "accountApi",
            "appNav",
            "$scope",
        ];

        email = "";
        showEmailError = false;
        showUserNotInSystem = false;
        isBusy = false;

        constructor(
            private accountApi: AccountService,
            private appNav: AppNavService,
            $scope: ng.IScope) {

            $scope.$watch(() => this.email, () => this.showUserNotInSystem = false);
        }

        get registerUrl(): string {
            if (this.email && this.email.indexOf("@") >= 0) {
                return `#/register/${this.email}`;
            }

            return "#/register";
        }

        checkEmail() {
            if (!this.email) {
                this.showEmailError = true;
            } else if (!this.isBusy) {
                this.resetValidationStates();
                this.isBusy = true;
                this.accountApi.getUserWithEmail(this.email)
                    .then(result => this.userFetched(result))
                    .finally(() => this.isBusy = false);
            }
        }

        userFetched(user: Server.User | null) {
            if (user == null) {
                // If we didn't find a user, that means we need to redirect to the register account 
                // to create a new user.
                this.showUserNotInSystem = true;
            } else if (user.requiresPasswordReset) {
                // If we require password reset (e.g. they're imported from the
                // old system and haven't created a new password yet), redirect to the create password page.
                this.appNav.createPassword(this.email);
            } else {
                // We have a user that's ready to go.
                this.appNav.password(this.email);
            }
        }

        resetValidationStates() {
            this.showUserNotInSystem = false;
            this.showEmailError = false;
        }
    }

    App.controller("SignInController", SignInController);
}
