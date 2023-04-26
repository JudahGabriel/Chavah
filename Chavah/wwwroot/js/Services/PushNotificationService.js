var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Provides a means to subscribe to PWA push notifications from Chavah.
         * These notifications are typically announcements of new music and features from the Chavah blog.
         * @see https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user
         * */
        var PushNotificationService = /** @class */ (function () {
            function PushNotificationService(homeViewModel, httpApi, $q) {
                this.homeViewModel = homeViewModel;
                this.httpApi = httpApi;
                this.$q = $q;
            }
            /**
             * Runs a check to see if we can subscribe to push notifications.
             * */
            PushNotificationService.prototype.isSupported = function () {
                var deferred = this.$q.defer();
                this.getPushManager()
                    .then(function (mgr) { return deferred.resolve(!!mgr); })
                    .catch(function () { return deferred.resolve(false); }); // If there was an error, resolve (not reject) with false; it means the device/browser doesn't support push notifications.
                return deferred.promise;
            };
            /**
             * Gets the subscription status for the current device.
             * */
            PushNotificationService.prototype.getStatus = function () {
                var _this = this;
                return this.getPushManager()
                    .then(function (mgr) { return _this.getPermissionStateFromManager(mgr); });
            };
            /**
             * Checks whether push notifications are supported, push notifications haven't been blocked by the user, and that there's no current subscription.
             * */
            PushNotificationService.prototype.canSubscribe = function () {
                var deferred = this.$q.defer();
                this.$q.all([this.getStatus(), this.getExistingPushSubscription()])
                    .then(function (stateAndSub) { return deferred.resolve(stateAndSub[0] !== "denied" && !stateAndSub[1]); })
                    .catch(function (error) { return deferred.resolve(false); }); // Error? The device doesn't support push notifications. Resolve (not reject) with false.
                return deferred.promise;
            };
            /**
             * Checks whether we already have a subscription.
             * */
            PushNotificationService.prototype.isSubscribed = function () {
                return this.getExistingPushSubscription()
                    .then(function (sub) { return !!sub; });
            };
            /**
             *  Prompts the user to accept push notifications.
             */
            PushNotificationService.prototype.askPermission = function () {
                var deferred = this.$q.defer();
                // The old Push Notifications spec took a callback. The new one returns a promise.
                // We can't tell what version of the API is implemented by the current borwser, so we handle both.
                var permissionResult = Notification.requestPermission(function (result) { return deferred.resolve(result); });
                if (permissionResult) {
                    permissionResult
                        .then(function (result) { return deferred.resolve(result); })
                        .catch(function (error) { return deferred.reject(error); });
                }
                return deferred.promise;
            };
            /**
             * Creates an HTML5 push subscription and stores it on the server.
             * This should only be called after permission was granted via askPermission.
             */
            PushNotificationService.prototype.subscribe = function () {
                var _this = this;
                return this.getSvcWorkerRegistration()
                    .then(function (registration) { return _this.createSubscription(registration); })
                    .then(function (subscription) { return _this.storePushNotificationSubscription(subscription); });
            };
            /**
             * Unsubscribes this device's existing push notification subscription.
             * */
            PushNotificationService.prototype.unsubscribe = function () {
                var _this = this;
                return this.getExistingPushSubscription()
                    .then(function (subscription) { return _this.unsubscribeAndDelete(subscription); });
            };
            PushNotificationService.prototype.getExistingPushSubscription = function () {
                var _this = this;
                return this.getPushManager()
                    .then(function (mgr) { return _this.getSubscriptionFromPushManager(mgr); });
            };
            PushNotificationService.prototype.unsubscribeAndDelete = function (subscription) {
                var _this = this;
                var deferred = this.$q.defer();
                if (subscription) {
                    subscription.unsubscribe()
                        .then(function (unsubResult) {
                        deferred.resolve(unsubResult);
                        _this.deleteSubscription(subscription);
                    })
                        .catch(function (error) { return deferred.reject(error); });
                }
                else {
                    deferred.reject("No subscription");
                }
                return deferred.promise;
            };
            PushNotificationService.prototype.deleteSubscription = function (subscription) {
                this.httpApi.post("/api/pushnotifications/delete", subscription);
            };
            PushNotificationService.prototype.getSubscriptionFromPushManager = function (manager) {
                var deferred = this.$q.defer();
                if (manager) {
                    manager.getSubscription()
                        .then(function (sub) { return deferred.resolve(sub); })
                        .catch(function (error) { return deferred.resolve(error); });
                }
                else {
                    deferred.reject("No push manager");
                }
                return deferred.promise;
            };
            PushNotificationService.prototype.storePushNotificationSubscription = function (subscription) {
                if (subscription) {
                    var url = "/api/pushnotifications/store";
                    return this.httpApi.post(url, subscription);
                }
                return this.$q.reject("No subscription");
            };
            PushNotificationService.prototype.createSubscription = function (registration) {
                var deferred = this.$q.defer();
                if (registration) {
                    var subscribeOptions = {
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array(this.homeViewModel.pushNotificationsPublicKey)
                    };
                    registration.pushManager.subscribe(subscribeOptions)
                        .then(function (subscription) { return deferred.resolve(subscription); })
                        .catch(function (error) { return deferred.reject(["Unable to subscribe to push notifications", error, Notification ? Notification.permission : ""]); });
                }
                else {
                    deferred.reject("No registration");
                }
                return deferred.promise;
            };
            PushNotificationService.prototype.getSvcWorkerRegistration = function () {
                var deferred = this.$q.defer();
                if (navigator.serviceWorker) {
                    navigator.serviceWorker.ready
                        .then(function (result) { return deferred.resolve(result || null); })
                        .catch(function (error) { return deferred.reject(error); });
                }
                else {
                    deferred.reject("No service worker");
                }
                return deferred.promise;
            };
            PushNotificationService.prototype.getPushManager = function () {
                var deferred = this.$q.defer();
                this.getSvcWorkerRegistration()
                    .then(function (reg) { return deferred.resolve(reg && reg.pushManager ? reg.pushManager : null); })
                    .catch(function (error) { return deferred.reject(error); });
                return deferred.promise;
            };
            PushNotificationService.prototype.getPermissionStateFromManager = function (manager) {
                var deferred = this.$q.defer();
                if (manager) {
                    manager.permissionState()
                        .then(function (val) { return deferred.resolve(val); })
                        .catch(function (error) { return deferred.resolve("prompt"); }); // Chrome 71 will throw here with a DOMException if we unregistered. Resolve with default status when this happens.
                }
                else {
                    deferred.reject("No push manager");
                }
                return deferred.promise;
            };
            /**
             * urlBase64ToUint8Array
             *
             * @param {string} base64String a public vavid key
             * @see https://github.com/GoogleChromeLabs/web-push-codelab/issues/46#issuecomment-429273981
             */
            PushNotificationService.prototype.urlBase64ToUint8Array = function (base64String) {
                var padding = '='.repeat((4 - base64String.length % 4) % 4);
                var base64 = (base64String + padding)
                    .replace(/\-/g, '+')
                    .replace(/_/g, '/');
                var rawData = window.atob(base64);
                var outputArray = new Uint8Array(rawData.length);
                for (var i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            };
            PushNotificationService.$inject = [
                "homeViewModel",
                "httpApi",
                "$q"
            ];
            return PushNotificationService;
        }());
        Chavah.PushNotificationService = PushNotificationService;
        Chavah.App.service("pushNotifications", PushNotificationService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=PushNotificationService.js.map