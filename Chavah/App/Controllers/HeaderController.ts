namespace BitShuva.Chavah {
    export class HeaderController {
        
        static $inject = [
            "accountApi"
        ];

        constructor(            
            private accountApi: AccountService) {
        }

        get currentUserName(): string {
            return this.accountApi.currentUser ? this.accountApi.currentUser.email : "";
        }

        signOut() {
            this.accountApi.signOut()
                .then(() => window.location.reload());
        }
    }

    App.controller("HeaderController", HeaderController);
}