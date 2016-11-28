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
            var signInTask = this.httpApi.post<SignInResult>("/Account/SignIn", args);
            signInTask.then(result => {
                if (result.status === SignInStatus.Success) {
                    this.localStorageService.set(SignInService.jwtKey, result.jsonWebToken);
                    this.localStorageService.set(SignInService.hasSignedInKey, true);
                    this.currentUser = new User(result.email!, result.roles);
                } else {
                    this.localStorageService.set(SignInService.jwtKey, "");
                    this.localStorageService.set(SignInService.hasSignedInKey, false);
                    this.currentUser = null;
                }
            });

            return signInTask;
        }
    }

    App.service("signInApi", SignInService);
}