namespace BitShuva.Chavah {
    export class AccountService {
        
        private static readonly hasSignedInKey = "hasSignedInSuccessfully"
        static readonly jwtKey = "jwt";
        static $inject = [
            "appNav",
            "initConfig",
            "httpApi",
            "localStorageService"
        ];

        currentUser: User | null;
        signedIn = new Rx.BehaviorSubject<boolean>(false);

        constructor(
            private appNav: AppNavService,
            private initConfig: InitConfig,
            private httpApi: HttpApiService,
            private localStorageService: ng.local.storage.ILocalStorageService) {

            if (this.initConfig.userEmail) {
                this.currentUser = new User(this.initConfig.userEmail, this.initConfig.userRoles);
                this.setAuthLocalStorage(this.initConfig.jwt);
                this.signedIn.onNext(true);
            }
        }

        get hasSignedInOnThisDevice(): boolean {
            return this.localStorageService.get<boolean>(AccountService.hasSignedInKey);
        }

        get isSignedIn(): boolean {
            return !!this.currentUser;
        }

        signOut(): ng.IPromise<any> {
            var signOutTask = this.httpApi.post("/api/Accounts/SignOut", null);
            signOutTask
                .then(() => {
                    this.currentUser = null;
                    this.setAuthLocalStorage(null);
                    this.signedIn.onNext(false);
                });
            return signOutTask;
        }

        register(email: string, password: string): ng.IPromise<Server.IRegisterResults> {
            var escapedEmail = encodeURIComponent(email);
            var escapedPassword = encodeURIComponent(password);
            return this.httpApi.post(`/api/Accounts/Register?email=${escapedEmail}&password=${escapedPassword}`, null);
        }

        getUserWithEmail(email: string): ng.IPromise<Server.IApplicationUser | null> {
            var args = {
                email: email
            };
            return this.httpApi.query<Server.IApplicationUser | null>("/api/Accounts/GetUserWithEmail", args);
        }

        createPassword(email: string, password: string): ng.IPromise<any> {
            var emailEscaped = encodeURIComponent(email);
            var passwordEscaped = encodeURIComponent(password);
            return this.httpApi.post(`/api/Accounts/CreatePassword?email=${emailEscaped}&password=${passwordEscaped}`, null);
        }

        signIn(email: string, password: string, staySignedIn: boolean): ng.IPromise<SignInResult> {
            var emailEscaped = encodeURIComponent(email);
            var passwordEscaped = encodeURIComponent(password);
            var signInTask = this.httpApi.post<SignInResult>(`/api/Accounts/SignIn?email=${emailEscaped}&password=${passwordEscaped}&staySignedIn=${staySignedIn}`, null);
            signInTask.then(result => {
                if (result.status === SignInStatus.Success) {
                    this.setAuthLocalStorage(result.jsonWebToken);
                    this.currentUser = new User(result.email!, result.roles);
                    this.signedIn.onNext(true);
                } else {
                    this.setAuthLocalStorage(result.jsonWebToken);
                    this.currentUser = null;
                    this.signedIn.onNext(false);
                }
            });

            return signInTask;
        }

        confirmEmail(email: string, confirmCode: string): ng.IPromise<Server.IConfirmEmailResult> {
            var escapedEmail = encodeURIComponent(email);
            var escapedConfirmCode = encodeURIComponent(confirmCode);
            return this.httpApi.post(`/api/Accounts/ConfirmEmail?email=${escapedEmail}&confirmCode=${escapedConfirmCode}`, null);
        }

        sendPasswordResetEmail(email: string): ng.IPromise<Server.IResetPasswordResult> {
            return this.httpApi.post(`/api/Accounts/SendResetPasswordEmail?email=${encodeURIComponent(email)}`, null);
        }

        resetPassword(email: string, passwordResetCode: string, newPassword: string): ng.IPromise<Server.IResetPasswordResult> {
            var escapedEmail = encodeURIComponent(email);
            var escapedPasswordResetCode = encodeURIComponent(passwordResetCode);
            var escapedNewPassword = encodeURIComponent(newPassword);
            return this.httpApi.post(`/api/Accounts/ResetPassword?email=${escapedEmail}&passwordResetCode=${escapedPasswordResetCode}&newPassword=${escapedNewPassword}`, null);
        }

        private setAuthLocalStorage(jwt: string | null) {
            this.localStorageService.set(AccountService.jwtKey, jwt);
            if (jwt) {
                this.localStorageService.set(AccountService.hasSignedInKey, true);
            }
        }
    }

    App.service("accountApi", AccountService);
}