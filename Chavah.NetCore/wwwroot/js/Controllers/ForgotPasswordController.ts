namespace BitShuva.Chavah {
    export class ForgotPasswordController {

        static $inject = [
            "accountApi",
        ];

        email = "";
        resetPasswordSuccessfully = false;
        couldNotFindEmail = false;
        resetErrorMessage = "";
        isBusy = false;

        constructor(private accountApi: AccountService) {
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

        passwordResetCompleted(result: Server.IResetPasswordResult) {
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
