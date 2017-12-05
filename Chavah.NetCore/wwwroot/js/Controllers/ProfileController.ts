namespace BitShuva.Chavah {
    export class ProfileController {

        static $inject = [
            "initConfig",
            "accountApi",
            "$timeout",
        ];

        profile: any;

        constructor(private readonly initConfig: Server.IHomeViewModel,
            private readonly accountApi: AccountService,
            private readonly $timeout: ng.ITimeoutService,
        ) {
         

            if (this.initConfig.userEmail) {
                this.loadProfile();
            } else {
                //due to the variables set in window["BitShuva.Chavah.HomeViewModel"] we have to refresh.
                //TODO: replace into localStrogage??
                window.location.reload();
            }
        }

        loadProfile() {
            this.accountApi.getUserWithEmail(this.initConfig.userEmail)
                .then(resp => {
                    this.profile = resp;
                    this.profile.lastSeen = moment(this.profile.lastSeen).format("LLL");
                    this.profile.registrationDate = moment(this.profile.registrationDate).format("LLL");

                });
        }
    }

    App.controller("ProfileController", ProfileController);
}