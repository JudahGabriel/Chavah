namespace BitShuva.Chavah {
    export class HeaderController {

        notifications: Server.INotification[];
        isNotificationPopoverOpened = false;

        static $inject = [
            "initConfig",
            "accountApi",
            "$timeout"
        ];

        constructor(            
            private readonly initConfig: InitConfig,
            private readonly accountApi: AccountService,
            private readonly $timeout: ng.ITimeoutService) {

            this.notifications = initConfig.notifications;
            $timeout(() => this.encourageUserToViewNotifications(), 15000);
        }

        get currentUserName(): string {
            return this.accountApi.currentUser ? this.accountApi.currentUser.email : "";
        }

        get unreadNotificationCount(): number {
            return this.notifications.filter(n => n.isUnread).length;
        }

        encourageUserToViewNotifications() {
            // If the user has some notifications, and some of them are unread, encourage the user to view them.
            // Adding this functionality because we've found a great many users never click the notifications button.
            if (this.notifications.length > 0 && this.notifications.some(n => n.isUnread)) {
                this.isNotificationPopoverOpened = true;
            }
        }

        markNotificationsAsRead() {
            if (this.notifications.some(n => n.isUnread)) {
                this.notifications.forEach(n => n.isUnread = false);
                this.accountApi.clearNotifications();
            }

            this.isNotificationPopoverOpened = false;
        }

        signOut() {
            this.accountApi.signOut()
                .then(() => window.location.reload());
        }
    }

    App.controller("HeaderController", HeaderController as any);
}