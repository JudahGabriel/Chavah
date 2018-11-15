namespace BitShuva.Chavah {
    export class HeaderController {
        
        notifications: Server.Notification[];
        profilePicUrl: string | null = null;

        static $inject = [
            "homeViewModel",
            "accountApi",
            "appNav",
            "pwaInstall",
            "audioPlayer"
        ];

        constructor(
            private readonly homeViewModel: Server.HomeViewModel,
            private readonly accountApi: AccountService,
            private readonly appNav: AppNavService,
            private readonly pwaInstall: PwaInstallService,
            private readonly audioPlayer: AudioPlayerService) {

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
            return this.pwaInstall.canInstall;
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
    }

    App.controller("HeaderController", HeaderController);
}
