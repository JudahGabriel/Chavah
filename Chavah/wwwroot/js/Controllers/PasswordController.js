var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var PasswordController = /** @class */ (function () {
            function PasswordController(accountApi, appNav, userApi, $routeParams, $timeout, $scope) {
                var _this = this;
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.userApi = userApi;
                this.$timeout = $timeout;
                this.email = "";
                this.profilePic = null;
                this.showPasswordError = false;
                this.passwordError = "";
                this.isBusy = false;
                this.password = "";
                this.staySignedIn = true;
                this.signInSuccessful = false;
                this.showResendConfirmEmail = false;
                this.sendConfirmationEmailState = "none";
                this.email = $routeParams["email"];
                $scope.$watch(function () { return _this.password; }, function () { return _this.passwordChanged(); });
            }
            Object.defineProperty(PasswordController.prototype, "isPasswordValid", {
                get: function () {
                    return this.password.length >= 6;
                },
                enumerable: false,
                configurable: true
            });
            PasswordController.prototype.$onInit = function () {
                var _this = this;
                // Fetch the profile picture for this user.
                this.userApi.getProfilePicForEmailAddress(this.email)
                    .then(function (results) { return _this.profilePic = results; });
            };
            PasswordController.prototype.signIn = function () {
                var _this = this;
                if (!this.isPasswordValid) {
                    this.showPasswordError = true;
                    this.passwordError = "Passwords must be at least 6 characters long.";
                    return;
                }
                if (!this.isBusy) {
                    this.isBusy = true;
                    var signInModel = new SignInModel();
                    signInModel.email = this.email;
                    signInModel.password = this.password;
                    signInModel.staySignedIn = this.staySignedIn;
                    this.accountApi.signIn(signInModel)
                        .then(function (result) { return _this.signInCompleted(result); }, function (error) { return _this.signInErred(error); })
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
                    // tslint:disable-next-line:max-line-length
                    this.passwordError = "Please check your email. We've sent you an email with a link to confirm your account.";
                    this.showResendConfirmEmail = true;
                }
                else if (result.status === Chavah.SignInStatus.Failure) {
                    this.showPasswordError = true;
                    this.passwordError = "Incorrect password";
                }
                else if (result.status === Chavah.SignInStatus.Pwned) {
                    this.showPasswordError = true;
                    this.passwordError = result.errorMessage || "Select a different password because the password you chose has appeared in a data breach";
                    this.$timeout(function () { return _this.appNav.resetPwnedPassword(_this.email); }, 4000);
                }
            };
            PasswordController.prototype.signInErred = function (error) {
                this.showPasswordError = true;
                this.passwordError = "There was a problem signing in. If the problem keeps happening, email us: chavah@messianicradio.com. Error details: " + (error && error.toString ? error.toString() : "[null]");
            };
            PasswordController.prototype.passwordChanged = function () {
                this.showPasswordError = false;
                this.passwordError = "";
            };
            PasswordController.prototype.sendConfirmationEmail = function () {
                var _this = this;
                this.sendConfirmationEmailState = "sending";
                this.accountApi.resendConfirmationEmail(this.email)
                    .then(function () { return _this.sendConfirmationEmailState = "sent"; });
            };
            PasswordController.$inject = [
                "accountApi",
                "appNav",
                "userApi",
                "$routeParams",
                "$timeout",
                "$scope",
            ];
            return PasswordController;
        }());
        Chavah.PasswordController = PasswordController;
        var SignInModel = /** @class */ (function () {
            function SignInModel() {
            }
            return SignInModel;
        }());
        Chavah.SignInModel = SignInModel;
        Chavah.App.controller("PasswordController", PasswordController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=PasswordController.js.map