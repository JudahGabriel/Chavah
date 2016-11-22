namespace BitShuva.Chavah {
    export class CreatePasswordController {

        email: string;
        password = "";
        showPasswordError = false;
        emailWithoutDomain: string;

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

        createPassword() {
        }
    }

    App.controller("CreatePasswordController", CreatePasswordController);
}