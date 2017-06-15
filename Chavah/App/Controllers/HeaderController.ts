namespace BitShuva.Chavah {
    export class HeaderController {

        notifications: Server.INotification[];

        static $inject = [
            "initConfig",
            "accountApi"
        ];

        constructor(            
            private readonly initConfig: InitConfig,
            private readonly accountApi: AccountService) {

            this.notifications = initConfig.notifications;
        }

        get currentUserName(): string {
            return this.accountApi.currentUser ? this.accountApi.currentUser.email : "";
        }

        get unreadNotificationCount(): number {
            return this.notifications.filter(n => n.isUnread).length;
        }

        markNotificationsAsRead() {
            if (this.notifications.some(n => n.isUnread)) {
                this.notifications.forEach(n => n.isUnread = false);
                this.accountApi.clearNotifications();
            }
        }

        signOut() {
            this.accountApi.signOut()
                .then(() => window.location.reload());
        }
    }

    App.controller("HeaderController", HeaderController);
}