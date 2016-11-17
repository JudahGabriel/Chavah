namespace BitShuva.Chavah {
    export class SignInController {

        showPassword = false;
        email = "";
        showEmailError = false;
        isBusy = false;
        
        static $inject = [
            "signInApi",
            "appNav"
        ];

        constructor(
            private signInApi: SignInService,
            private appNav: AppNavService) {

            this.scheduleMigrationZanz();
        }

        scheduleMigrationZanz() {
            $.get("/account/migrate")
                .then((result: number) => {
                    if (result > 0) {
                        this.scheduleMigrationZanz();
                    }
                })
                .fail(error => {
                    console.log("failed to migrate ", error);
                    setTimeout(() => this.scheduleMigrationZanz(), 5000);
                });
        }

        checkEmail() {
            if (!this.email) {
                this.showEmailError = true;
            } else if (!this.isBusy) {
                this.isBusy = true;
                this.signInApi.getUserWithEmail(this.email)
                    .then(result => this.userFetched(result))
                    .finally(() => this.isBusy = false);
            }
        }

        userFetched(user: Server.IApplicationUser | null) {
            if (user == null) {
                // If we didn't find a user, that means we need to redirect to the register account to create a new user.
                this.appNav.register(this.email);
            } else if (user.requiresPasswordReset) {
                // If we require password reset (e.g. they're imported from the 
                // old system and haven't created a new password yet), redirect to the create password page.
                this.appNav.createPassword(this.email);
            } else {
                // We have a user that's ready to go.
                this.appNav.password(this.email);
            }
        }
    }

    App.controller("SignInController", SignInController);
}