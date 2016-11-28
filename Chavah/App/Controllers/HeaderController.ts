namespace BitShuva.Chavah {
    export class HeaderController {
        
        static $inject = [
            "signInApi"
        ];

        constructor(            
            private signInApi: SignInService) {
        }

        get currentUserName(): string {
            return this.signInApi.currentUser ? this.signInApi.currentUser.email : "";
        }

        signOut() {
            this.signInApi.signOut()
                .then(() => window.location.reload());
        }
    }

    App.controller("HeaderController", HeaderController);
}