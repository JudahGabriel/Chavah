var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var RegisterController = (function () {
            function RegisterController(accountApi, $routeParams) {
                this.accountApi = accountApi;
                this.email = "";
                this.password = "";
                this.showEmailError = false;
                this.showPasswordError = false;
                this.showRegisterSuccess = false;
                this.showAlreadyRegistered = false;
                this.showNeedsConfirmation = false;
                this.registrationError = "";
                this.isBusy = false;
                var routeEmail = $routeParams["email"];
                if (routeEmail) {
                    this.email = routeEmail;
                }
            }
            Object.defineProperty(RegisterController.prototype, "isValidEmail", {
                get: function () {
                    return !!this.email && this.email.lastIndexOf("@") >= 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RegisterController.prototype, "isValidPassword", {
                get: function () {
                    return !!this.password && this.password.length >= 6;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RegisterController.prototype, "showRegisterForm", {
                get: function () {
                    return !this.showAlreadyRegistered && !this.showNeedsConfirmation && !this.showRegisterSuccess;
                },
                enumerable: true,
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
                    this.accountApi.register(this.email, this.password)
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
                else {
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
            };
            return RegisterController;
        }());
        RegisterController.$inject = [
            "accountApi",
            "$routeParams"
        ];
        Chavah.RegisterController = RegisterController;
        Chavah.App.controller("RegisterController", RegisterController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
