namespace BitShuva.Chavah {
    export class CreatePasswordController {

        readonly email: string;
        readonly emailWithoutDomain: string;
        password = "";
        showPasswordError = false;
        isSaving = false;
        hasCreatedPassword = false;

        static readonly minPasswordLength = 6;

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
            this.emailWithoutDomain = this.email.substr(0, this.email.indexOf('@'));
        }

        get isPasswordValid(): boolean {
            return this.password.length >= 6;
        }

        createPassword() {
            if (!this.isPasswordValid) {
                this.showPasswordError = true;
                return;
            }

            if (!this.isSaving) {
                this.isSaving = true;
                this.signInApi.createPassword(this.email, this.password)
                    .then(() => this.hasCreatedPassword = true)
                    .finally(() => this.isSaving = false);
            }
        }
    }

    App.controller("CreatePasswordController", CreatePasswordController);
}