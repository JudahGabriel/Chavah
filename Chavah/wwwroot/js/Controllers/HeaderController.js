var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var HeaderController = /** @class */ (function () {
            function HeaderController(homeViewModel, accountApi, appNav, pwaInstall, pushNotifications, audioPlayer, $timeout) {
                var _this = this;
                this.homeViewModel = homeViewModel;
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.pwaInstall = pwaInstall;
                this.pushNotifications = pushNotifications;
                this.audioPlayer = audioPlayer;
                this.$timeout = $timeout;
                this.profilePicUrl = null;
                this.canSubscribeToPushNotifications = false;
                this.showDonationBanner = false;
                this.accountApi.signedInState
                    .select(function () { return _this.accountApi.currentUser; })
                    .subscribe(function (user) { return _this.signedInUserChanged(user); });
            }
            Object.defineProperty(HeaderController.prototype, "isAdmin", {
                get: function () {
                    if (this.accountApi.currentUser === undefined || this.accountApi.currentUser === null) {
                        return false;
                    }
                    else {
                        return this.accountApi.currentUser.isAdmin;
                    }
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "currentUserName", {
                get: function () {
                    return this.accountApi.currentUser ? this.accountApi.currentUser.email : "";
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "unreadNotificationCount", {
                get: function () {
                    if (this.notifications) {
                        return this.notifications.filter(function (n) { return n.isUnread; }).length;
                    }
                    return 0;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "title", {
                get: function () {
                    return this.homeViewModel.pageTitle;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "desc", {
                get: function () {
                    return this.homeViewModel.pageDescription;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "canInstallPwa", {
                get: function () {
                    var isInstalled = window.matchMedia && (window.matchMedia("(display-mode: minimal-ui)").matches || window.matchMedia("(display-mode: standalone)").matches);
                    return !isInstalled && this.pwaInstall.canInstall;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "isOnIOS", {
                get: function () {
                    // This is used to support the iOS app, which doesn't support links to new tabs in the iOS app.
                    // Instead, we have to use regular links and the app will launch Safari to handle them.
                    // We can likely remove this code when we migrate the iOS app from UIWebView to WKWebKit.
                    var ua = navigator.userAgent.toLowerCase();
                    return ua.includes("iphone") || ua.includes("ipad");
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "showGoBack", {
                get: function () {
                    // Show go back when we're not at the root (now playing).
                    return window.location.hash !== "#/";
                },
                enumerable: false,
                configurable: true
            });
            HeaderController.prototype.$onInit = function () {
                var _this = this;
                this.loadPushNotificationState();
                this.updateAppBadge(this.unreadNotificationCount);
                if (!this.hasDismissedDonationBanner()) {
                    this.$timeout(function () { return _this.showDonationBanner = true; }, 5 * 60 * 1000); // 5 minutes
                }
            };
            HeaderController.prototype.loadPushNotificationState = function () {
                var _this = this;
                this.pushNotifications.canSubscribe()
                    .then(function (val) { return _this.canSubscribeToPushNotifications = val; });
            };
            HeaderController.prototype.markNotificationsAsRead = function () {
                if (this.notifications.some(function (n) { return n.isUnread; })) {
                    this.notifications.forEach(function (n) { return n.isUnread = false; });
                    this.accountApi.clearNotifications();
                }
                this.updateAppBadge(0);
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
                    this.updateAppBadge(this.unreadNotificationCount);
                }
            };
            HeaderController.prototype.installPwa = function () {
                var _this = this;
                var installTask = this.pwaInstall.install();
                if (installTask) {
                    installTask.then(function (userChoice) {
                        if (userChoice.outcome === "accepted") {
                            // Upon successful install, pause the music. 
                            // Otherwise we may have 2 Chavah instances playing audio.
                            _this.audioPlayer.pause();
                        }
                    });
                }
            };
            HeaderController.prototype.askPermissionForPushNotifications = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var permissionResult;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.pushNotifications.askPermission()];
                            case 1:
                                permissionResult = _a.sent();
                                if (!(permissionResult === "granted")) return [3 /*break*/, 3];
                                return [4 /*yield*/, this.pushNotifications.subscribe()];
                            case 2:
                                _a.sent();
                                this.appNav.pushSubscriptionSuccessful();
                                return [3 /*break*/, 4];
                            case 3:
                                console.log("Push notification permission wasn't granted", permissionResult);
                                _a.label = 4;
                            case 4:
                                this.loadPushNotificationState();
                                return [2 /*return*/];
                        }
                    });
                });
            };
            HeaderController.prototype.updateAppBadge = function (count) {
                // If available, utilize the new app badge proposed web standard.
                // https://github.com/WICG/badging/blob/master/explainer.md
                var navigatorWithBadgeSupport = navigator;
                var supportsAppBadge = navigatorWithBadgeSupport.setAppBadge && navigatorWithBadgeSupport.clearAppBadge;
                if (supportsAppBadge) {
                    if (count > 0) {
                        navigatorWithBadgeSupport.setAppBadge(count);
                    }
                    else {
                        navigatorWithBadgeSupport.clearAppBadge();
                    }
                }
            };
            HeaderController.prototype.hasDismissedDonationBanner = function () {
                return window.localStorage.getItem(HeaderController.donationBannerLocalStorageKey) === "true";
            };
            HeaderController.prototype.dismissDonationBanner = function () {
                window.localStorage.setItem(HeaderController.donationBannerLocalStorageKey, "true");
            };
            HeaderController.donationBannerLocalStorageKey = "hasDismissedDonationBanner";
            HeaderController.$inject = [
                "homeViewModel",
                "accountApi",
                "appNav",
                "pwaInstall",
                "pushNotifications",
                "audioPlayer",
                "$timeout"
            ];
            return HeaderController;
        }());
        Chavah.HeaderController = HeaderController;
        Chavah.App.controller("HeaderController", HeaderController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=HeaderController.js.map