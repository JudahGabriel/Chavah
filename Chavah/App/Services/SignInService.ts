namespace BitShuva.Chavah {
    export class SignInService {
        
        private static readonly hasSignedInKey = "hasSignedInSuccessfully"
        static readonly jwtKey = "jwt";
        static $inject = [
            "appNav",
            "initConfig",
            "httpApi",
            "localStorageService"
        ];

        currentUser: User | null;

        constructor(
            private appNav: AppNavService,
            private initConfig: InitConfig,
            private httpApi: HttpApiService,
            private localStorageService: ng.local.storage.ILocalStorageService) {

            if (this.initConfig.userEmail) {
                this.currentUser = new User(this.initConfig.userEmail, this.initConfig.userRoles);
            }
        }

        get hasSignedInOnThisDevice(): boolean {
            return this.localStorageService.get<boolean>(SignInService.hasSignedInKey);
        }

        get isSignedIn(): boolean {
            return !!this.currentUser;
        }

        signOut(): ng.IPromise<any> {
            var signOutTask = this.httpApi.post("/Account/SignOut", null);
            signOutTask
                .then(() => this.currentUser = null)
                .then(() => this.setAuthLocalStorage(null))
            return signOutTask;
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
            var signInTask = this.httpApi.post<SignInResult>("/Account/SignIn", args);
            signInTask.then(result => {
                if (result.status === SignInStatus.Success) {
                    this.setAuthLocalStorage(result.jsonWebToken);
                    this.currentUser = new User(result.email!, result.roles);
                } else {
                    this.setAuthLocalStorage(result.jsonWebToken);
                    this.currentUser = null;
                }
            });

            return signInTask;
        }

        private setAuthLocalStorage(jwt: string | null) {
            this.localStorageService.set(SignInService.jwtKey, jwt);
            if (jwt) {
                this.localStorageService.set(SignInService.hasSignedInKey, true);
            }
        }
    }

    App.service("signInApi", SignInService);
}