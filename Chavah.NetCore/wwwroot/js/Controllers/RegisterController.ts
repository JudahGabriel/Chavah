namespace BitShuva.Chavah {
    export class RegisterController {
        
        email = "";
        password = "";
        confirmPassword = "";
        showEmailError = false;
        showPasswordError = false;
        showRegisterSuccess = false;
        showAlreadyRegistered = false;
        showNeedsConfirmation = false;
        showPasswordIsPwned = false;
        registrationError = "";
        isBusy = false;

        static $inject = [
            "accountApi",
            "appNav",
            "$routeParams"
        ];

        constructor(
            private readonly accountApi: AccountService,
            private readonly appNav: AppNavService,
            $routeParams: ng.route.IRouteParamsService) {

            // TODO: do we need this code? What cases do we send email address?
            const routeEmail: string | null = $routeParams["email"];
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

        get isMatchingPassword(): boolean {
            return this.isValidPassword && this.password !== this.confirmPassword
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
                let registerModel = new RegisterModel();
                registerModel.email = this.email;
                registerModel.password = this.password;
                registerModel.confirmPassword = this.password;

                this.accountApi.register(registerModel)
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
            } else if (results.isPwned) {
                this.showPasswordIsPwned = true;
            }
            else {
                // tslint:disable-next-line:max-line-length
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

    export class RegisterModel implements Server.IRegisterModel {
        email: string;
        password: string;
        confirmPassword: string;
    }

    App.controller("RegisterController", RegisterController);
}
