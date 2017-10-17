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
                    this.setAuthLocalStorage(this.initConfig.jwt);
                    this.signedIn.onNext(true);
                }
            }
            Object.defineProperty(AccountService.prototype, "hasSignedInOnThisDevice", {
                get: function () {
                    return this.localStorageService.get(AccountService.hasSignedInKey);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AccountService.prototype, "isSignedIn", {
                get: function () {
                    return !!this.currentUser;
                },
                enumerable: true,
                configurable: true
            });
            AccountService.prototype.signOut = function () {
                var _this = this;
                var signOutTask = this.httpApi.post("/api/Accounts/SignOut", null);
                signOutTask
                    .then(function () {
                    _this.currentUser = null;
                    _this.setAuthLocalStorage(null);
                    _this.signedIn.onNext(false);
                });
                return signOutTask;
            };
            AccountService.prototype.clearNotifications = function () {
                return this.httpApi.post("/api/accounts/clearNotifications", null);
            };
            AccountService.prototype.register = function (email, password) {
                var escapedEmail = encodeURIComponent(email);
                var escapedPassword = encodeURIComponent(password);
                return this.httpApi.post("/api/Accounts/Register?email=" + escapedEmail + "&password=" + escapedPassword, null);
            };
            AccountService.prototype.getUserWithEmail = function (email) {
                var args = {
                    email: email
                };
                return this.httpApi.query("/api/Accounts/GetUserWithEmail", args);
            };
            AccountService.prototype.createPassword = function (email, password) {
                var emailEscaped = encodeURIComponent(email);
                var passwordEscaped = encodeURIComponent(password);
                return this.httpApi.post("/api/Accounts/CreatePassword?email=" + emailEscaped + "&password=" + passwordEscaped, null);
            };
            AccountService.prototype.signIn = function (email, password, staySignedIn) {
                var _this = this;
                var emailEscaped = encodeURIComponent(email);
                var passwordEscaped = encodeURIComponent(password);
                var signInTask = this.httpApi.post("/api/Accounts/SignIn?email=" + emailEscaped + "&password=" + passwordEscaped + "&staySignedIn=" + staySignedIn, null);
                signInTask.then(function (result) {
                    if (result.status === Chavah.SignInStatus.Success) {
                        _this.setAuthLocalStorage(result.jsonWebToken);
                        _this.currentUser = new Chavah.User(result.email, result.roles);
                        _this.signedIn.onNext(true);
                        // If we have Google Analytics, notify about the signed in user.
                        var ga = window["ga"];
                        if (ga) {
                            ga("set", "userId", result.email);
                        }
                    }
                    else {
                        _this.setAuthLocalStorage(result.jsonWebToken);
                        _this.currentUser = null;
                        _this.signedIn.onNext(false);
                    }
                });
                return signInTask;
            };
            AccountService.prototype.confirmEmail = function (email, confirmCode) {
                var escapedEmail = encodeURIComponent(email);
                var escapedConfirmCode = encodeURIComponent(confirmCode);
                return this.httpApi.post("/api/Accounts/ConfirmEmail?email=" + escapedEmail + "&confirmCode=" + escapedConfirmCode, null);
            };
            AccountService.prototype.sendPasswordResetEmail = function (email) {
                return this.httpApi.post("/api/Accounts/SendResetPasswordEmail?email=" + encodeURIComponent(email), null);
            };
            AccountService.prototype.resetPassword = function (email, passwordResetCode, newPassword) {
                var escapedEmail = encodeURIComponent(email);
                var escapedPasswordResetCode = encodeURIComponent(passwordResetCode);
                var escapedNewPassword = encodeURIComponent(newPassword);
                return this.httpApi.post("/api/Accounts/ResetPassword?email=" + escapedEmail + "&passwordResetCode=" + escapedPasswordResetCode + "&newPassword=" + escapedNewPassword, null);
            };
            AccountService.prototype.setAuthLocalStorage = function (jwt) {
                this.localStorageService.set(AccountService.jwtKey, jwt);
                if (jwt) {
                    this.localStorageService.set(AccountService.hasSignedInKey, true);
                }
            };
            return AccountService;
        }());
        AccountService.hasSignedInKey = "hasSignedInSuccessfully";
        AccountService.jwtKey = "jwt";
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
