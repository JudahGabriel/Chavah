namespace BitShuva.Chavah {
    export class HeaderController {

        static $inject = [
            "initConfig",
            "accountApi",
            "appNav",
            "$timeout",
        ];

        notifications: Server.INotification[];
        isNotificationPopoverOpened = false;

        constructor(private readonly initConfig: Server.IHomeViewModel,
                    private readonly accountApi: AccountService,
                    private appNav: AppNavService,
                    private readonly $timeout: ng.ITimeoutService,
        ) {

            this.notifications = initConfig.notifications;
            $timeout(() => this.encourageUserToViewNotifications(), 15000);
        }

        get currentUserName(): string {
            return this.accountApi.currentUser ? this.accountApi.currentUser.email : "";
        }

        get unreadNotificationCount(): number {
            return this.notifications.filter(n => n.isUnread).length;
        }

        get title(): string {
            return this.initConfig.title;
        }

        get desc(): string {
            return this.initConfig.description;
        }

        encourageUserToViewNotifications() {
            // If the user has some notifications, and some of them are unread, encourage the user to view them.
            // Adding this functionality because we've found a great many users never click the notifications button.
            if (this.notifications.length > 0 && this.notifications.some(n => n.isUnread)) {
                this.isNotificationPopoverOpened = true;
            }
        }

        markNotificationsAsRead() {
            this.isNotificationPopoverOpened = false;
            if (this.notifications.some(n => n.isUnread)) {
                this.notifications.forEach(n => n.isUnread = false);
                this.accountApi.clearNotifications(this.notifications[0].date);
            }
        }

        signOut() {
            this.accountApi.signOut()
                //.then(() => window.location.reload());
                .then(() => this.appNav.signOut());
        }
    }

    App.controller("HeaderController", HeaderController);
}
