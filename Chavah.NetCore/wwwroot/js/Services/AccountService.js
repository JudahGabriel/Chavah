var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AccountService = (function () {
            function AccountService(appNav, initConfig, httpApi, localStorageService) {
                this.appNav = appNav;
                this.initConfig = initConfig;
                this.httpApi = httpApi;
                this.localStorageService = localStorageService;
                this.signedIn = new Rx.BehaviorSubject(false);
                if (this.initConfig.userEmail) {
                    this.currentUser = new Chavah.User(this.initConfig.userEmail, this.initConfig.userRoles);
                    this.signedIn.onNext(true);
                }
            }
            Object.defineProperty(AccountService.prototype, "isSignedIn", {
                get: function () {
                    return !!this.currentUser;
                },
                enumerable: true,
                configurable: true
            });
            AccountService.prototype.signOut = function () {
                var _this = this;
                var signOutTask = this.httpApi.post("/api/account/SignOut", null);
                signOutTask
                    .then(function () {
                    _this.currentUser = null;
                    _this.signedIn.onNext(false);
                });
                return signOutTask;
            };
            AccountService.prototype.clearNotifications = function (asOfDate) {
                var args = {
                    asOf: asOfDate
                };
                return this.httpApi.postUriEncoded("/api/account/clearNotifications", args);
            };
            AccountService.prototype.register = function (email, password) {
                var args = {
                    email: email,
                    password: password
                };
                return this.httpApi.postUriEncoded("/api/account/register", args);
            };
            AccountService.prototype.getUserWithEmail = function (email) {
                var args = {
                    email: email
                };
                return this.httpApi.query("/api/account/getUserWithEmail", args);
            };
            AccountService.prototype.createPassword = function (email, password) {
                var args = {
                    email: email,
                    password: password
                };
                return this.httpApi.postUriEncoded("/api/account/createPassword", args);
            };
            AccountService.prototype.signIn = function (email, password, staySignedIn) {
                var _this = this;
                var args = {
                    email: email,
                    password: password,
                    staySignedIn: staySignedIn
                };
                var signInTask = this.httpApi.postUriEncoded("/api/account/signIn", args);
                signInTask.then(function (result) {
                    if (result.status === Chavah.SignInStatus.Success) {
                        _this.currentUser = new Chavah.User(result.email, result.roles);
                        _this.signedIn.onNext(true);
                        // If we have Google Analytics, notify about the signed in user.
                        var ga = window["ga"];
                        if (ga) {
                            ga("set", "userId", result.email);
                        }
                    }
                    else {
                        _this.currentUser = null;
                        _this.signedIn.onNext(false);
                    }
                });
                return signInTask;
            };
            AccountService.prototype.confirmEmail = function (email, confirmCode) {
                var args = {
                    email: email,
                    confirmCode: confirmCode
                };
                return this.httpApi.postUriEncoded("/api/account/ConfirmEmail", args);
            };
            AccountService.prototype.sendPasswordResetEmail = function (email) {
                var args = {
                    email: email
                };
                return this.httpApi.postUriEncoded("/api/account/sendResetPasswordEmail", args);
            };
            AccountService.prototype.resetPassword = function (email, passwordResetCode, newPassword) {
                var args = {
                    email: email,
                    passwordResetCode: passwordResetCode,
                    newPassword: newPassword
                };
                return this.httpApi.postUriEncoded("/api/account/resetPassword", args);
            };
            return AccountService;
        }());
        AccountService.$inject = [
            "appNav",
            "initConfig",
            "httpApi",
            "localStorageService"
        ];
        Chavah.AccountService = AccountService;
        Chavah.App.service("accountApi", AccountService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
