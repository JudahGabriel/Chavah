var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SignInController = /** @class */ (function () {
            function SignInController(accountApi, appNav, $scope) {
                var _this = this;
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.email = "";
                this.showEmailError = false;
                this.showUserNotInSystem = false;
                this.isBusy = false;
                $scope.$watch(function () { return _this.email; }, function () { return _this.showUserNotInSystem = false; });
            }
            Object.defineProperty(SignInController.prototype, "registerUrl", {
                get: function () {
                    if (this.email && this.email.indexOf("@") >= 0) {
                        return "#/register/" + this.email;
                    }
                    return "#/register";
                },
                enumerable: true,
                configurable: true
            });
            SignInController.prototype.checkEmail = function () {
                var _this = this;
                if (!this.email) {
                    this.showEmailError = true;
                }
                else if (!this.isBusy) {
                    this.resetValidationStates();
                    this.isBusy = true;
                    this.accountApi.getUserWithEmail(this.email)
                        .then(function (result) { return _this.userFetched(result); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            SignInController.prototype.userFetched = function (user) {
                if (user == null) {
                    // If we didn't find a user, that means we need to redirect to the register account 
                    // to create a new user.
                    this.showUserNotInSystem = true;
                }
                else if (user.requiresPasswordReset) {
                    // If we require password reset (e.g. they're imported from the
                    // old system and haven't created a new password yet), redirect to the create password page.
                    this.appNav.createPassword(this.email);
                }
                else {
                    // We have a user that's ready to go.
                    this.appNav.password(this.email);
                }
            };
            SignInController.prototype.resetValidationStates = function () {
                this.showUserNotInSystem = false;
                this.showEmailError = false;
            };
            SignInController.$inject = [
                "accountApi",
                "appNav",
                "$scope",
            ];
            return SignInController;
        }());
        Chavah.SignInController = SignInController;
        Chavah.App.controller("SignInController", SignInController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SignInController.js.map