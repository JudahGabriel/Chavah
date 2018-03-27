namespace BitShuva.Chavah {
    export class ProfileController {

        static $inject = [
            "initConfig",
            "accountApi",
            "$timeout",
        ];

        email: string;
        lastSeen: string;
        registrationDate: string;
        phone: string;

        constructor(
            private readonly initConfig: Server.HomeViewModel,
            private readonly accountApi: AccountService) {
        }

        $onInit() {
            if (this.initConfig.user) {
                this.loadProfile(this.initConfig.user);
            }
        }

        loadProfile(user: Server.AppUser) {
            this.accountApi.getUserWithEmail(user.email)
                .then(user => {
                    if (user) {
                        this.email = user.email;
                        this.lastSeen = moment(user.lastSeen).format("LLL");
                        this.registrationDate = moment(user.registrationDate).format("LLL");
                        this.phone = user.phoneNumber;
                    }
                });
        }
    }

    App.controller("ProfileController", ProfileController);
}