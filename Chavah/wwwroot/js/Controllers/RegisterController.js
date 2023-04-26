var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var RegisterController = /** @class */ (function () {
            function RegisterController(accountApi, appNav, $routeParams) {
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.email = "";
                this.password = "";
                this.confirmPassword = "";
                this.showEmailError = false;
                this.showPasswordError = false;
                this.showRegisterSuccess = false;
                this.showAlreadyRegistered = false;
                this.showNeedsConfirmation = false;
                this.showPasswordIsPwned = false;
                this.registrationError = "";
                this.isBusy = false;
                // TODO: do we need this code? What cases do we send email address?
                var routeEmail = $routeParams["email"];
                if (routeEmail) {
                    this.email = routeEmail;
                }
            }
            Object.defineProperty(RegisterController.prototype, "isValidEmail", {
                get: function () {
                    return !!this.email && this.email.lastIndexOf("@") >= 0;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(RegisterController.prototype, "isValidPassword", {
                get: function () {
                    return !!this.password && this.password.length >= 6;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(RegisterController.prototype, "isMatchingPassword", {
                get: function () {
                    return this.isValidPassword && this.password !== this.confirmPassword;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(RegisterController.prototype, "showRegisterForm", {
                get: function () {
                    return !this.showAlreadyRegistered && !this.showNeedsConfirmation && !this.showRegisterSuccess;
                },
                enumerable: false,
                configurable: true
            });
            RegisterController.prototype.register = function () {
                var _this = this;
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
                    var registerModel = new RegisterModel();
                    registerModel.email = this.email;
                    registerModel.password = this.password;
                    registerModel.confirmPassword = this.password;
                    this.accountApi.register(registerModel)
                        .then(function (results) { return _this.registrationCompleted(results); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            RegisterController.prototype.registrationCompleted = function (results) {
                if (results.success) {
                    this.showRegisterSuccess = true;
                }
                else if (results.needsConfirmation) {
                    this.showNeedsConfirmation = true;
                }
                else if (results.isAlreadyRegistered) {
                    this.showAlreadyRegistered = true;
                }
                else if (results.isPwned) {
                    this.showPasswordIsPwned = true;
                }
                else {
                    // tslint:disable-next-line:max-line-length
                    this.registrationError = results.errorMessage || "Unable to register your user. Please contact judahgabriel@gmail.com";
                }
            };
            RegisterController.prototype.reset = function () {
                this.registrationError = "";
                this.showAlreadyRegistered = false;
                this.showEmailError = false;
                this.showNeedsConfirmation = false;
                this.showPasswordError = false;
                this.showRegisterSuccess = false;
                this.showPasswordIsPwned = false;
            };
            RegisterController.$inject = [
                "accountApi",
                "appNav",
                "$routeParams"
            ];
            return RegisterController;
        }());
        Chavah.RegisterController = RegisterController;
        var RegisterModel = /** @class */ (function () {
            function RegisterModel() {
            }
            return RegisterModel;
        }());
        Chavah.RegisterModel = RegisterModel;
        Chavah.App.controller("RegisterController", RegisterController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=RegisterController.js.map