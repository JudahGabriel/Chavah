namespace BitShuva.Chavah {
    type NotificationPermissionResult = "granted" | "denied" | "default";

    /**
     * Provides a means to subscribe to PWA push notifications from Chavah. 
     * These notifications are typically announcements of new music and features from the Chavah blog.
     * @see https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user
     * */
    export class PushNotificationService {
        
        static $inject = [
            "homeViewModel",
            "httpApi",
            "$q"
        ];

        constructor(
            private readonly homeViewModel: Server.HomeViewModel,
            private readonly httpApi: HttpApiService,
            private readonly $q: ng.IQService) {
            
        }

        /**
         * Runs a check to see if we can subscribe to push notifications.
         * */
        isSupported(): ng.IPromise<boolean> {
            const deferred = this.$q.defer<boolean>();
            this.getPushManager()
                .then(mgr => deferred.resolve(!!mgr))
                .catch(() => deferred.resolve(false)) // If there was an error, resolve (not reject) with false; it means the device/browser doesn't support push notifications.
            return deferred.promise;
        }

        /**
         * Gets the subscription status for the current device.
         * */
        getStatus(): ng.IPromise<PushPermissionState> {
            return this.getPushManager()
                .then(mgr => this.getPermissionStateFromManager(mgr));
        }

        /**
         * Checks whether push notifications are supported, push notifications haven't been blocked by the user, and that there's no current subscription.
         * */
        canSubscribe(): ng.IPromise<boolean> {
            const deferred = this.$q.defer<boolean>();
            this.$q.all([this.getStatus(), this.getExistingPushSubscription()])
                .then(stateAndSub => deferred.resolve(stateAndSub[0] !== "denied" && !stateAndSub[1]))
                .catch(error => deferred.resolve(false)); // Error? The device doesn't support push notifications. Resolve (not reject) with false.
              
            return deferred.promise;
        }

        /**
         * Checks whether we already have a subscription.
         * */
        isSubscribed(): ng.IPromise<boolean> {
            return this.getExistingPushSubscription()
                .then(sub => !!sub);
        }

        /** 
         *  Prompts the user to accept push notifications.
         */
        askPermission(): ng.IPromise<NotificationPermissionResult> {       
            const deferred = this.$q.defer<NotificationPermissionResult>();

            // The old Push Notifications spec took a callback. The new one returns a promise.
            // We can't tell what version of the API is implemented by the current borwser, so we handle both.
            const permissionResult = Notification.requestPermission(result => deferred.resolve(result));
            if (permissionResult) {
                permissionResult
                    .then(result => deferred.resolve(result))
                    .catch(error => deferred.reject(error));
            }

            return deferred.promise;
        }

        /**
         * Creates an HTML5 push subscription and stores it on the server. 
         * This should only be called after permission was granted via askPermission.
         */
        subscribe(): ng.IPromise<Server.IPushSubscription | null> {
            return this.getSvcWorkerRegistration()
                .then(registration => this.createSubscription(registration))
                .then(subscription => this.storePushNotificationSubscription(subscription));
        }

        /**
         * Unsubscribes this device's existing push notification subscription.
         * */
        unsubscribe(): ng.IPromise<boolean> {
            return this.getExistingPushSubscription()
                .then(subscription => this.unsubscribeAndDelete(subscription));
        }

        private getExistingPushSubscription(): ng.IPromise<PushSubscription | null> {
            return this.getPushManager()
                .then(mgr => this.getSubscriptionFromPushManager(mgr));
        }

        private unsubscribeAndDelete(subscription: PushSubscription | null): ng.IPromise<boolean> {
            const deferred = this.$q.defer<boolean>();
            if (subscription) {
                subscription.unsubscribe()
                    .then(unsubResult => {
                        deferred.resolve(unsubResult);
                        this.deleteSubscription(subscription);
                    })
                    .catch(error => deferred.reject(error));
            } else {
                deferred.reject("No subscription");
            }

            return deferred.promise;
        }

        private deleteSubscription(subscription: PushSubscription) {
            this.httpApi.post("/api/pushnotifications/delete", subscription)
        }

        private getSubscriptionFromPushManager(manager: PushManager | null): ng.IPromise<PushSubscription | null> {
            const deferred = this.$q.defer<PushSubscription | null>();
            if (manager) {
                manager.getSubscription()
                    .then(sub => deferred.resolve(sub))
                    .catch(error => deferred.resolve(error));
            } else {
                deferred.reject("No push manager");
            }

            return deferred.promise;
        }

        private storePushNotificationSubscription(subscription: PushSubscription | null): ng.IPromise<Server.IPushSubscription | null> {
            if (subscription) {
                const url = "/api/pushnotifications/store";
                return this.httpApi.post(url, subscription);
            }

            return this.$q.reject("No subscription");
        }

        private createSubscription(registration: ServiceWorkerRegistration | null): ng.IPromise<PushSubscription | null> {
            var deferred = this.$q.defer<PushSubscription | null>();

            if (registration) {
                const subscribeOptions = {
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.homeViewModel.pushNotificationsPublicKey)
                };

                registration.pushManager.subscribe(subscribeOptions)
                    .then(subscription => deferred.resolve(subscription))
                    .catch(error => deferred.reject(["Unable to subscribe to push notifications", error, Notification ? Notification.permission : ""]));
            } else {
                deferred.reject("No registration");
            }

            return deferred.promise;
        }

        private getSvcWorkerRegistration(): ng.IPromise<ServiceWorkerRegistration | null> {
            const deferred = this.$q.defer<ServiceWorkerRegistration | null>();

            if (navigator.serviceWorker) {
                navigator.serviceWorker.ready
                    .then(result => deferred.resolve(result || null))
                    .catch(error => deferred.reject(error));
            } else {
                deferred.reject("No service worker");
            }

            return deferred.promise;
        }

        private getPushManager(): ng.IPromise<PushManager | null> {
            const deferred = this.$q.defer<PushManager | null>();
            this.getSvcWorkerRegistration()
                .then(reg => deferred.resolve(reg && reg.pushManager ? reg.pushManager : null))
                .catch(error => deferred.reject(error));

            return deferred.promise;
        }

        private getPermissionStateFromManager(manager: PushManager | null): ng.IPromise<PushPermissionState> {
            const deferred = this.$q.defer<PushPermissionState>();
            if (manager) {
                manager.permissionState()
                    .then(val => deferred.resolve(val))
                    .catch(error => deferred.resolve("prompt")); // Chrome 71 will throw here with a DOMException if we unregistered. Resolve with default status when this happens.
            } else {
                deferred.reject("No push manager");
            }

            return deferred.promise;
        }

        /**
         * urlBase64ToUint8Array
         * 
         * @param {string} base64String a public vavid key
         * @see https://github.com/GoogleChromeLabs/web-push-codelab/issues/46#issuecomment-429273981
         */
        private urlBase64ToUint8Array(base64String: string): Uint8Array {
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
        }
    }

    App.service("pushNotifications", PushNotificationService);
}