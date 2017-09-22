var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var PasswordController = (function () {
            function PasswordController(accountApi, appNav, $routeParams, $timeout, $scope) {
                var _this = this;
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.$timeout = $timeout;
                this.email = "";
                this.showPasswordError = false;
                this.passwordError = "";
                this.isBusy = false;
                this.password = "";
                this.staySignedIn = true;
                this.signInSuccessful = false;
                this.email = $routeParams["email"];
                $scope.$watch(function () { return _this.password; }, function () { return _this.passwordChanged(); });
            }
            Object.defineProperty(PasswordController.prototype, "isPasswordValid", {
                get: function () {
                    return this.password.length >= 6;
                },
                enumerable: true,
                configurable: true
            });
            PasswordController.prototype.signIn = function () {
                var _this = this;
                if (!this.isPasswordValid) {
                    this.showPasswordError = true;
                    this.passwordError = "Passwords must be at least 6 characters long.";
                    return;
                }
                if (!this.isBusy) {
                    this.isBusy = true;
                    this.accountApi.signIn(this.email, this.password, this.staySignedIn)
                        .then(function (result) { return _this.signInCompleted(result); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            PasswordController.prototype.signInCompleted = function (result) {
                var _this = this;
                if (result.status === Chavah.SignInStatus.Success) {
                    this.signInSuccessful = true;
                    this.$timeout(function () { return _this.appNav.nowPlaying(); }, 2000);
                }
                else if (result.status === Chavah.SignInStatus.LockedOut) {
                    this.showPasswordError = true;
                    this.passwordError = "Your account is locked out. Please contact judahgabriel@gmail.com";
                }
                else if (result.status === Chavah.SignInStatus.RequiresVerification) {
                    this.showPasswordError = true;
                    this.passwordError = "Please check your email. We've sent you an email with a link to confirm your account.";
                }
                else if (result.status === Chavah.SignInStatus.Failure) {
                    this.showPasswordError = true;
                    this.passwordError = "Incorrect password";
                }
            };
            PasswordController.prototype.passwordChanged = function () {
                this.showPasswordError = false;
                this.passwordError = "";
            };
            return PasswordController;
        }());
        PasswordController.$inject = [
            "accountApi",
            "appNav",
            "$routeParams",
            "$timeout",
            "$scope"
        ];
        Chavah.PasswordController = PasswordController;
        Chavah.App.controller("PasswordController", PasswordController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
