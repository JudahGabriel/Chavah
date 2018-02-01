namespace BitShuva.Chavah {
    export class HeaderController {

        static $inject = [
            "initConfig",
            "accountApi",
            "appNav"
        ];

        notifications: Server.INotification[];

        constructor(private readonly initConfig: Server.IHomeViewModel,
                    private readonly accountApi: AccountService,
                    private appNav: AppNavService) {

            this.notifications = initConfig.notifications;
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

        markNotificationsAsRead() {
            if (this.notifications.some(n => n.isUnread)) {
                this.notifications.forEach(n => n.isUnread = false);
                this.accountApi.clearNotifications(this.notifications[0].date);
            }
        }

        signOut() {
            this.accountApi.signOut()
                .then(() => this.appNav.signOut());
        }
    }

    App.controller("HeaderController", HeaderController);
}
