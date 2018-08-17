namespace BitShuva.Chavah {
    export class HeaderController {
        
        notifications: Server.Notification[];
        profilePicUrl: string | null = null;

        static $inject = [
            "initConfig",
            "accountApi",
            "appNav"
        ];

        constructor(private readonly initConfig: Server.ConfigViewModel,
                    private readonly accountApi: AccountService,
                    private appNav: AppNavService) {

            this.notifications = initConfig.user ? initConfig.user.notifications : [];
            this.profilePicUrl = initConfig.user ? initConfig.user.profilePicUrl : null;

            this.accountApi.signedIn
                .select(() => this.accountApi.currentUser)
                .subscribe(user => this.signedInUserChanged(user));
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
                this.accountApi.clearNotifications();
            }
        }

        signOut() {
            this.accountApi.signOut()
                .then(() => this.appNav.signOut());
        }

        signedInUserChanged(user: User | null) {
            if (user) {
                this.notifications = user.notifications;
                this.profilePicUrl = user.profilePicUrl;
            }
        }
    }

    App.controller("HeaderController", HeaderController);
}
