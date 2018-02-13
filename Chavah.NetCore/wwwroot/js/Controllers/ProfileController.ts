namespace BitShuva.Chavah {
    export class ProfileController {

        static $inject = [
            "initConfig",
            "accountApi",
            "$timeout",
        ];

        profile: any;

        constructor(
            private readonly initConfig: Server.HomeViewModel,
            private readonly accountApi: AccountService,
            private readonly $timeout: ng.ITimeoutService) {
         
            if (this.initConfig.user) {
                this.loadProfile(this.initConfig.user);
            }
        }

        loadProfile(user: Server.AppUser) {
            this.accountApi.getUserWithEmail(user.email)
                .then(resp => {
                    this.profile = resp;
                    this.profile.lastSeen = moment(this.profile.lastSeen).format("LLL");
                    this.profile.registrationDate = moment(this.profile.registrationDate).format("LLL");
                });
        }
    }

    App.controller("ProfileController", ProfileController);
}