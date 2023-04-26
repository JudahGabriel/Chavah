var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ForgotPasswordController = /** @class */ (function () {
            function ForgotPasswordController(accountApi, $routeParams) {
                this.accountApi = accountApi;
                this.$routeParams = $routeParams;
                this.email = "";
                this.pwned = false;
                this.resetPasswordSuccessfully = false;
                this.couldNotFindEmail = false;
                this.resetErrorMessage = "";
                this.isBusy = false;
                var email = $routeParams["email"];
                if (email) {
                    this.email = email;
                }
                var pwned = $routeParams["pwned"];
                if (pwned) {
                    this.pwned = Boolean(pwned);
                }
            }
            Object.defineProperty(ForgotPasswordController.prototype, "registerUrl", {
                get: function () {
                    if (this.email && this.email.indexOf("@") >= 0) {
                        return "#/register/" + encodeURIComponent(this.email);
                    }
                    return "#/register";
                },
                enumerable: false,
                configurable: true
            });
            ForgotPasswordController.prototype.resetPassword = function () {
                var _this = this;
                var isValidEmail = this.email && this.email.includes("@");
                if (!isValidEmail) {
                    this.resetErrorMessage = "Please enter your email so we can reset your password";
                    return;
                }
                this.resetFields();
                if (!this.isBusy) {
                    this.isBusy = true;
                    this.accountApi.sendPasswordResetEmail(this.email)
                        .then(function (results) { return _this.passwordResetCompleted(results); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            ForgotPasswordController.prototype.passwordResetCompleted = function (result) {
                if (result.success) {
                    this.resetPasswordSuccessfully = true;
                }
                else if (result.invalidEmail) {
                    this.couldNotFindEmail = true;
                }
                else {
                    this.resetErrorMessage = result.errorMessage || "Unable to reset password";
                }
            };
            ForgotPasswordController.prototype.resetFields = function () {
                this.couldNotFindEmail = false;
                this.resetPasswordSuccessfully = false;
                this.resetErrorMessage = "";
            };
            ForgotPasswordController.$inject = [
                "accountApi",
                "$routeParams",
            ];
            return ForgotPasswordController;
        }());
        Chavah.ForgotPasswordController = ForgotPasswordController;
        Chavah.App.controller("ForgotPasswordController", ForgotPasswordController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=ForgotPasswordController.js.map