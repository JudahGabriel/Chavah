namespace BitShuva.Chavah {
    export class AccountService {

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
            private initConfig: Server.IHomeViewModel,
            private httpApi: HttpApiService,
            private localStorageService: ng.local.storage.ILocalStorageService) {

            if (this.initConfig.userEmail) {
                this.currentUser = new User(this.initConfig.userEmail, this.initConfig.userRoles);
                this.signedIn.onNext(true);
            }
        }

        get isSignedIn(): boolean {
            return !!this.currentUser;
        }

        signOut(): ng.IPromise<any> {
            var signOutTask = this.httpApi.post("/api/account/SignOut", null);
            signOutTask
                .then(() => {
                    this.currentUser = null;
                    this.signedIn.onNext(false);
                });
            return signOutTask;
        }

        clearNotifications(asOfDate: string): ng.IPromise<number> {
            var args = {
                asOf: asOfDate
            };
            return this.httpApi.postUriEncoded("/api/account/clearNotifications", args);
        }

        register(email: string, password: string): ng.IPromise<Server.IRegisterResults> {
            var escapedEmail = encodeURIComponent(email);
            var escapedPassword = encodeURIComponent(password);
            return this.httpApi.post(`/api/account/Register?email=${escapedEmail}&password=${escapedPassword}`, null);
        }

        getUserWithEmail(email: string): ng.IPromise<Server.IApplicationUser | null> {
            var args = {
                email: email
            };
            return this.httpApi.query<Server.IApplicationUser | null>("/api/account/GetUserWithEmail", args);
        }

        createPassword(email: string, password: string): ng.IPromise<any> {
            var emailEscaped = encodeURIComponent(email);
            var passwordEscaped = encodeURIComponent(password);
            return this.httpApi.post(`/api/account/CreatePassword?email=${emailEscaped}&password=${passwordEscaped}`, null);
        }

        signIn(email: string, password: string, staySignedIn: boolean): ng.IPromise<SignInResult> {
            var emailEscaped = encodeURIComponent(email);
            var passwordEscaped = encodeURIComponent(password);
            var signInTask = this.httpApi.post<SignInResult>(`/api/account/SignIn?email=${emailEscaped}&password=${passwordEscaped}&staySignedIn=${staySignedIn}`, null);
            signInTask.then(result => {
                if (result.status === SignInStatus.Success) {
                    this.currentUser = new User(result.email!, result.roles);
                    this.signedIn.onNext(true);

                    // If we have Google Analytics, notify about the signed in user.
                    var ga = window["ga"];
                    if (ga) {
                        ga("set", "userId", result.email);
                    }
                } else {
                    this.currentUser = null;
                    this.signedIn.onNext(false);
                }
            });

            return signInTask;
        }

        confirmEmail(email: string, confirmCode: string): ng.IPromise<Server.IConfirmEmailResult> {
            var escapedEmail = encodeURIComponent(email);
            var escapedConfirmCode = encodeURIComponent(confirmCode);
            return this.httpApi.post(`/api/account/ConfirmEmail?email=${escapedEmail}&confirmCode=${escapedConfirmCode}`, null);
        }

        sendPasswordResetEmail(email: string): ng.IPromise<Server.IResetPasswordResult> {
            return this.httpApi.post(`/api/account/SendResetPasswordEmail?email=${encodeURIComponent(email)}`, null);
        }

        resetPassword(email: string, passwordResetCode: string, newPassword: string): ng.IPromise<Server.IResetPasswordResult> {
            var escapedEmail = encodeURIComponent(email);
            var escapedPasswordResetCode = encodeURIComponent(passwordResetCode);
            var escapedNewPassword = encodeURIComponent(newPassword);
            return this.httpApi.post(`/api/account/ResetPassword?email=${escapedEmail}&passwordResetCode=${escapedPasswordResetCode}&newPassword=${escapedNewPassword}`, null);
        }
    }

    App.service("accountApi", AccountService);
}