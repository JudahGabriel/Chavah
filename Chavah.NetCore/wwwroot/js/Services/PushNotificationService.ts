namespace BitShuva.Chavah {
    /**
     * Provides a means to subscribe to PWA push notifications from Chavah. 
     * These notifications are typically announcements of new music and features from the Chavah blog.
     * @see https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user
     * */
    export class PushNotificationService {

        static $inject = [
            "homeViewModel",
            "userApi"
        ];

        constructor(
            private readonly homeViewModel: Server.HomeViewModel,
            private readonly userApi: UserApiService) {
            
        }

        askPermission(): Promise<void> {
            // The old Push Notifications spec took a callback. The new one returns a promise.
            // We can't tell what version of the API is implemented by the current borwser, so we handle both.
            return new Promise(function (resolve, reject) {
                const permissionResult = Notification.requestPermission(function (result) {
                    resolve(result);
                });

                if (permissionResult) {
                    permissionResult.then(resolve, reject);
                }
            })
            .then(function (permissionResult: "granted" | "denied" | "default") {
                if (permissionResult !== "granted") {
                    console.log("Permission rejected", permissionResult);
                }
            });
        }

        private subscribeUserToPush() {
            navigator.serviceWorker.getRegistration()
                .then(registration => this.subscribePushManager(registration));
        }

        private subscribePushManager(registration: ServiceWorkerRegistration | undefined) {
            if (registration) {
                const subscribeOptions = {
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.homeViewModel.pushNotificationsPublicKey)
                };

                registration.pushManager.subscribe(subscribeOptions)
                    .then(subscription => this.userApi.addPushNotificationSubscription(subscription))
                    .catch(error => console.log("Unable to subscribe to push notifications", error, Notification ? Notification.permission : ""));
            }
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