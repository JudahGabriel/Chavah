var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AccountService = /** @class */ (function () {
            function AccountService(httpApi, initialUser) {
                this.httpApi = httpApi;
                this.apiUri = "/api/account";
                this.signedInState = new Rx.BehaviorSubject(!!initialUser);
                this.currentUser = initialUser ? new Chavah.User(initialUser) : null;
            }
            Object.defineProperty(AccountService.prototype, "isSignedIn", {
                get: function () {
                    return !!this.currentUser && !!this.currentUser.email;
                },
                enumerable: false,
                configurable: true
            });
            AccountService.prototype.signOut = function () {
                var _this = this;
                var signOutTask = this.httpApi.post(this.apiUri + "/signOut", null);
                signOutTask
                    .then(function () {
                    _this.currentUser = null;
                    _this.signedInState.onNext(false);
                });
                return signOutTask;
            };
            AccountService.prototype.clearNotifications = function () {
                return this.httpApi.post(this.apiUri + "/clearNotifications", null);
            };
            AccountService.prototype.register = function (registerModel) {
                return this.httpApi.post(this.apiUri + "/register", registerModel);
            };
            AccountService.prototype.getUserWithEmail = function (email) {
                var args = {
                    email: email,
                };
                return this.httpApi.query(this.apiUri + "/getUserWithEmail", args);
            };
            AccountService.prototype.createPassword = function (email, password) {
                var args = {
                    email: email,
                    password: password,
                };
                return this.httpApi.postUriEncoded(this.apiUri + "/createPassword", args);
            };
            AccountService.prototype.signIn = function (signInModel) {
                var _this = this;
                var signInTask = this.httpApi.post(this.apiUri + "/signIn", signInModel);
                signInTask.then(function (result) {
                    if (result.status === Chavah.SignInStatus.Success && result.user) {
                        _this.currentUser = new Chavah.User(result.user);
                        _this.signedInState.onNext(true);
                        // If we have Google Analytics, notify about the signed in user.
                        var ga = window["ga"];
                        if (ga) {
                            ga("set", "userId", result.user.email);
                        }
                    }
                    else {
                        _this.currentUser = null;
                        _this.signedInState.onNext(false);
                    }
                });
                return signInTask;
            };
            AccountService.prototype.confirmEmail = function (email, confirmCode) {
                var args = {
                    email: email,
                    confirmCode: confirmCode,
                };
                return this.httpApi.postUriEncoded(this.apiUri + "/confirmEmail", args);
            };
            AccountService.prototype.sendPasswordResetEmail = function (email) {
                var args = {
                    email: email,
                };
                return this.httpApi.postUriEncoded(this.apiUri + "/sendResetPasswordEmail", args);
            };
            AccountService.prototype.resetPassword = function (email, passwordResetCode, newPassword) {
                var args = {
                    email: email,
                    passwordResetCode: passwordResetCode,
                    newPassword: newPassword,
                };
                return this.httpApi.postUriEncoded(this.apiUri + "/resetPassword", args);
            };
            AccountService.prototype.sendSupportMessage = function (name, email, message, userAgent) {
                var args = {
                    name: name,
                    email: email,
                    message: message,
                    date: new Date().toISOString(),
                    userAgent: window.navigator.userAgent
                };
                return this.httpApi.post(this.apiUri + "/sendSupportMessage", args);
            };
            AccountService.prototype.resendConfirmationEmail = function (email) {
                var args = {
                    email: email
                };
                return this.httpApi.post(this.apiUri + "/resendConfirmationEmail", args);
            };
            AccountService.$inject = [
                "httpApi",
                "initialUser"
            ];
            return AccountService;
        }());
        Chavah.AccountService = AccountService;
        Chavah.App.service("accountApi", AccountService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AccountService.js.map