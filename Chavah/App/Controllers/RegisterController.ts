namespace BitShuva.Chavah {
    export class RegisterController {
        email = "";
        password = "";
        showEmailError = false;
        showPasswordError = false;
        showRegisterSuccess = false;
        showAlreadyRegistered = false;
        showNeedsConfirmation = false;
        registrationError = "";
        isBusy = false;

        static $inject = [
            "accountApi",
            "$routeParams"
        ];

        constructor(
            private accountApi: AccountService,
            $routeParams: ng.route.IRouteParamsService) {

            var routeEmail: string | null = $routeParams["email"];
            if (routeEmail) {
                this.email = routeEmail;
            }
        }

        get isValidEmail(): boolean {
            return !!this.email && this.email.lastIndexOf("@") >= 0;
        }

        get isValidPassword(): boolean {
            return !!this.password && this.password.length >= 6;
        }

        get showRegisterForm(): boolean {
            return !this.showAlreadyRegistered && !this.showNeedsConfirmation && !this.showRegisterSuccess;
        }

        register() {
            this.reset();

            if (!this.isValidEmail) {
                this.showEmailError = true;
                return;
            }
            if (!this.isValidPassword) {
                this.showPasswordError = true;
                return;
            }

            if (!this.isBusy) {
                this.isBusy = true;
                this.accountApi.register(this.email, this.password)
                    .then(results => this.registrationCompleted(results))
                    .finally(() => this.isBusy = false);
            }
        }

        registrationCompleted(results: Server.IRegisterResults) {
            if (results.success) {
                this.showRegisterSuccess = true;
            } else if(results.needsConfirmation) {
                this.showNeedsConfirmation = true;
            } else if (results.isAlreadyRegistered) {
                this.showAlreadyRegistered = true;
            } else {
                this.registrationError = results.errorMessage || "Unable to register your user. Please contact judahgabriel@gmail.com";
            }
        }

        reset() {
            this.registrationError = "";
            this.showAlreadyRegistered = false;
            this.showEmailError = false;
            this.showNeedsConfirmation = false;
            this.showPasswordError = false;
            this.showRegisterSuccess = false;
        }
    }

    App.controller("RegisterController", RegisterController as any);
}