namespace BitShuva.Chavah {
    export class ForgotPasswordController {

        static $inject = [
            "accountApi",
            "$routeParams",
        ];

        email = "";
        pwned = false;
        resetPasswordSuccessfully = false;
        couldNotFindEmail = false;
        resetErrorMessage = "";
        isBusy = false;

        constructor(private accountApi: AccountService,
            private $routeParams: ng.route.IRouteParamsService) {

            const email = $routeParams["email"];
            if (email) {
                this.email = email;
            }

            const pwned = $routeParams["pwned"];
            if (pwned) {
                this.pwned = Boolean(pwned);
            }
        }

        get registerUrl(): string {
            if (this.email && this.email.indexOf("@") >= 0) {
                return `#/register/${encodeURIComponent(this.email)}`;
            }

            return "#/register";
        }

        resetPassword() {
            let isValidEmail = this.email && this.email.includes("@");
            if (!isValidEmail) {
                this.resetErrorMessage = "Please enter your email so we can reset your password";
                return;
            }

            this.resetFields();

            if (!this.isBusy) {
                this.isBusy = true;
                this.accountApi.sendPasswordResetEmail(this.email)
                    .then(results => this.passwordResetCompleted(results))
                    .finally(() => this.isBusy = false);
            }
        }

        passwordResetCompleted(result: Server.ResetPasswordResult) {
            if (result.success) {
                this.resetPasswordSuccessfully = true;
            } else if (result.invalidEmail) {
                this.couldNotFindEmail = true;
            } else {
                this.resetErrorMessage = result.errorMessage || "Unable to reset password";
            }
        }

        resetFields() {
            this.couldNotFindEmail = false;
            this.resetPasswordSuccessfully = false;
            this.resetErrorMessage = "";
        }
    }

    App.controller("ForgotPasswordController", ForgotPasswordController);
}
