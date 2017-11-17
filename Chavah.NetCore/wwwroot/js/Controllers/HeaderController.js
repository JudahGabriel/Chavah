var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var HeaderController = (function () {
            function HeaderController(initConfig, accountApi, $timeout) {
                var _this = this;
                this.initConfig = initConfig;
                this.accountApi = accountApi;
                this.$timeout = $timeout;
                this.isNotificationPopoverOpened = false;
                this.notifications = initConfig.notifications;
                $timeout(function () { return _this.encourageUserToViewNotifications(); }, 15000);
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
            HeaderController.prototype.encourageUserToViewNotifications = function () {
                // If the user has some notifications, and some of them are unread, encourage the user to view them.
                // Adding this functionality because we've found a great many users never click the notifications button.
                if (this.notifications.length > 0 && this.notifications.some(function (n) { return n.isUnread; })) {
                    this.isNotificationPopoverOpened = true;
                }
            };
            HeaderController.prototype.markNotificationsAsRead = function () {
                if (this.notifications.some(function (n) { return n.isUnread; })) {
                    this.notifications.forEach(function (n) { return n.isUnread = false; });
                    this.accountApi.clearNotifications(this.notifications[0].date);
                }
                this.isNotificationPopoverOpened = false;
            };
            HeaderController.prototype.signOut = function () {
                this.accountApi.signOut()
                    .then(function () { return window.location.reload(); });
            };
            return HeaderController;
        }());
        HeaderController.$inject = [
            "initConfig",
            "accountApi",
            "$timeout"
        ];
        Chavah.HeaderController = HeaderController;
        Chavah.App.controller("HeaderController", HeaderController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
