namespace BitShuva.Chavah {
    export class SignInService {
        
        private static readonly hasSignedInKey = "hasSignedInSuccessfully"
        static $inject = [
            "appNav",
            "httpApi",
            "localStorageService"
        ];

        constructor(
            private appNav: AppNavService,
            private httpApi: HttpApiService,
            private localStorageService: ng.local.storage.ILocalStorageService) {
        }

        hasSignedInOnThisDevice(): boolean {
            return this.localStorageService.get<boolean>(SignInService.hasSignedInKey);
        }

        isSignedIn(): boolean {
            // UPGRADE TODO
            return false;
        }
        
        promptForSignIn() {
            this.appNav.signIn();
        }

        getUserWithEmail(email: string): ng.IPromise<Server.IApplicationUser | null> {
            var args = {
                email: email
            };
            return this.httpApi.query<Server.IApplicationUser | null>("/api/Users/GetUserWithEmail", args);
        }

        createPassword(email: string, password: string): ng.IPromise<any> {
            var args = {
                email: email,
                password: password
            };
            return this.httpApi.post("/Account/CreatePassword", args);
        }

        signIn(email: string, password: string, staySignedIn: boolean): ng.IPromise<SignInResult> {
            var args = {
                email: email,
                password: password,
                staySignedIn: staySignedIn
            };
            return this.httpApi.post("/Account/SignIn", args);
        }
    }

    App.service("signInApi", SignInService);
}