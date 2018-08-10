var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var HeaderController = /** @class */ (function () {
            function HeaderController(initConfig, accountApi, appNav) {
                var _this = this;
                this.initConfig = initConfig;
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.profilePicUrl = null;
                this.notifications = initConfig.user ? initConfig.user.notifications : [];
                this.profilePicUrl = initConfig.user ? initConfig.user.profilePicUrl : null;
                this.accountApi.signedIn
                    .select(function () { return _this.accountApi.currentUser; })
                    .subscribe(function (user) { return _this.signedInUserChanged(user); });
            }
            Object.defineProperty(HeaderController.prototype, "currentUserName", {
                get: function () {
                    return this.accountApi.currentUser ? this.accountApi.currentUser.email : "";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "unreadNotificationCount", {
                get: function () {
                    return this.notifications.filter(function (n) { return n.isUnread; }).length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "title", {
                get: function () {
                    return this.initConfig.title;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "desc", {
                get: function () {
                    return this.initConfig.description;
                },
                enumerable: true,
                configurable: true
            });
            HeaderController.prototype.markNotificationsAsRead = function () {
                if (this.notifications.some(function (n) { return n.isUnread; })) {
                    this.notifications.forEach(function (n) { return n.isUnread = false; });
                    this.accountApi.clearNotifications();
                }
            };
            HeaderController.prototype.signOut = function () {
                var _this = this;
                this.accountApi.signOut()
                    .then(function () { return _this.appNav.signOut(); });
            };
            HeaderController.prototype.signedInUserChanged = function (user) {
                if (user) {
                    this.notifications = user.notifications;
                    this.profilePicUrl = user.profilePicUrl;
                }
            };
            HeaderController.$inject = [
                "initConfig",
                "accountApi",
                "appNav"
            ];
            return HeaderController;
        }());
        Chavah.HeaderController = HeaderController;
        Chavah.App.controller("HeaderController", HeaderController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=HeaderController.js.map