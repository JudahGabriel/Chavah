namespace BitShuva.Chavah {
    export class HeaderController {
        
        notifications: Server.Notification[];
        profilePicUrl: string | null = null;
        canSubscribeToPushNotifications = false;
        showDonationBanner = false;
        highlightUnreadNotifications = false;
        hasOpenedNotifications = false;

        static readonly donationBannerLocalStorageKey = "hasDismissedDonationBanner";
        static $inject = [
            "homeViewModel",
            "accountApi",
            "appNav",
            "pwaInstall",
            "pushNotifications",
            "audioPlayer",
            "$timeout"
        ];

        constructor(
            private readonly homeViewModel: Server.HomeViewModel,
            private readonly accountApi: AccountService,
            private readonly appNav: AppNavService,
            private readonly pwaInstall: PwaInstallService,
            private readonly pushNotifications: PushNotificationService,
            private readonly audioPlayer: AudioPlayerService,
            private readonly $timeout: ng.ITimeoutService) {

            this.accountApi.signedInState
                .select(() => this.accountApi.currentUser)
                .subscribe(user => this.signedInUserChanged(user));
        }
        
        get isAdmin(): boolean {
            if (this.accountApi.currentUser === undefined || this.accountApi.currentUser === null) {
                return false;
            } else {
                return this.accountApi.currentUser.isAdmin;
            }
        }

        get currentUserName(): string {
            return this.accountApi.currentUser ? this.accountApi.currentUser.email : "";
        }

        get unreadNotificationCount(): number {
            if (this.notifications) {
                return this.notifications.filter(n => n.isUnread).length;
            }

            return 0;
        }

        get title(): string {
            return this.homeViewModel.pageTitle;
        }

        get desc(): string {
            return this.homeViewModel.pageDescription;
        }

        get canInstallPwa(): boolean {
            const isInstalled = window.matchMedia && (window.matchMedia("(display-mode: minimal-ui)").matches || window.matchMedia("(display-mode: standalone)").matches);
            return !isInstalled && this.pwaInstall.canInstall;
        }

        get isOnIOS(): boolean {
            // This is used to support the iOS app, which doesn't support links to new tabs in the iOS app.
            // Instead, we have to use regular links and the app will launch Safari to handle them.
            // We can likely remove this code when we migrate the iOS app from UIWebView to WKWebKit.
            var ua = navigator.userAgent.toLowerCase();
            return ua.includes("iphone") || ua.includes("ipad");
        }

        get showGoBack(): boolean {
            // Show go back when we're not at the root (now playing).
            return window.location.hash !== "#/";
        }

        $onInit() {
            this.loadPushNotificationState();
            this.updateAppBadge(this.unreadNotificationCount);

            // Show the donation banner after a short while.
            if (!this.hasDismissedDonationBanner() && !this.homeViewModel.embed) {
                this.$timeout(() => this.showDonationBanner = true, 5 * 60 * 1000); // 5 minutes
            }

            // Tell the user if they have unread notifications after a bit.
            this.$timeout(() => {
                if (this.notifications && this.notifications.filter(n => n.isUnread).length > 0) {
                    this.highlightUnreadNotifications = true;
                }
            }, 10 * 1000) // 10 seconds
        }

        loadPushNotificationState() {
            this.pushNotifications.canSubscribe()
                .then(val => this.canSubscribeToPushNotifications = val);
        }

        markNotificationsAsRead() {
            if (this.notifications.some(n => n.isUnread)) {
                this.notifications.forEach(n => n.isUnread = false);
                this.accountApi.clearNotifications();
            }

            this.updateAppBadge(0);
            this.highlightUnreadNotifications = false;
            this.hasOpenedNotifications = true;
        }

        signOut() {
            this.accountApi.signOut()
                .then(() => this.appNav.signOut());
        }

        signedInUserChanged(user: User | null) {
            if (user) {
                this.notifications = user.notifications;
                this.profilePicUrl = user.profilePicUrl;
                this.updateAppBadge(this.unreadNotificationCount);
            }
        }

        installPwa() {
            var installTask = this.pwaInstall.install();
            if (installTask) {
                installTask.then(userChoice => {
                    if (userChoice.outcome === "accepted") {
                        // Upon successful install, pause the music. 
                        // Otherwise we may have 2 Chavah instances playing audio.
                        this.audioPlayer.pause();
                    }
                })
            }
        }

        async askPermissionForPushNotifications() {
            const permissionResult = await this.pushNotifications.askPermission();
            if (permissionResult === "granted") {
                await this.pushNotifications.subscribe();
                this.appNav.pushSubscriptionSuccessful();
            } else {
                console.log("Push notification permission wasn't granted", permissionResult);
            }

            this.loadPushNotificationState();
        }

        private updateAppBadge(count: number) {
            // If available, utilize the new app badge proposed web standard.
            // https://github.com/WICG/badging/blob/master/explainer.md
            const navigatorWithBadgeSupport = navigator as any;
            const supportsAppBadge = navigatorWithBadgeSupport.setAppBadge && navigatorWithBadgeSupport.clearAppBadge;
            if (supportsAppBadge) {
                if (count > 0) {
                    navigatorWithBadgeSupport.setAppBadge(count);
                } else {
                    navigatorWithBadgeSupport.clearAppBadge();
                }
            }
        }

        hasDismissedDonationBanner(): boolean {
            return window.localStorage.getItem(HeaderController.donationBannerLocalStorageKey) === "true";
        }

        dismissDonationBanner() {
            window.localStorage.setItem(HeaderController.donationBannerLocalStorageKey, "true");
        }
    }

    App.controller("HeaderController", HeaderController);
}
