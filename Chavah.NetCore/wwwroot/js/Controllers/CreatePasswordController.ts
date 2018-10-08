namespace BitShuva.Chavah {
    export class CreatePasswordController {

        static readonly minPasswordLength = 6;

        static $inject = [
            "accountApi",
            "$routeParams",
        ];

        readonly email: string;
        readonly emailWithoutDomain: string;
        password = "";
        showPasswordError = false;
        isSaving = false;
        hasCreatedPassword = false;

        constructor(
            private accountApi: AccountService,
            $routeParams: ng.route.IRouteParamsService) {

            this.email = $routeParams["email"];
            this.emailWithoutDomain = this.email.substr(0, this.email.indexOf("@"));
        }

        get isPasswordValid(): boolean {
            return !!this.password && this.password.length >= 6 && !!this.password.match(ResetPasswordController.regexContainsLetterAndNumber);
        }

        createPassword() {
            if (!this.isPasswordValid) {
                this.showPasswordError = true;
                return;
            }

            if (!this.isSaving) {
                this.isSaving = true;
                this.accountApi.createPassword(this.email, this.password)
                    .then(() => this.hasCreatedPassword = true)
                    .finally(() => this.isSaving = false);
            }
        }
    }

    App.controller("CreatePasswordController", CreatePasswordController);
}