namespace BitShuva.Chavah {
    export class AccountService {

        static $inject = [
            "appNav",
            "initConfig",
            "httpApi",
            "localStorageService",
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
            let signOutTask = this.httpApi.post("/api/account/SignOut", null);
            signOutTask
                .then(() => {
                    this.currentUser = null;
                    this.signedIn.onNext(false);
                });
            return signOutTask;
        }

        clearNotifications(asOfDate: string): ng.IPromise<number> {
            let args = {
                asOf: asOfDate,
            };
            return this.httpApi.postUriEncoded("/api/account/clearNotifications", args);
        }

        register(email: string, password: string): ng.IPromise<Server.IRegisterResults> {
            let args = {
                email,
                password,
            };
            return this.httpApi.postUriEncoded("/api/account/register", args);
        }

        getUserWithEmail(email: string): ng.IPromise<Server.IAppUser | null> {
            let args = {
                email,
            };
            return this.httpApi.query<Server.IAppUser | null>("/api/account/getUserWithEmail", args);
        }

        createPassword(email: string, password: string): ng.IPromise<any> {
            let args = {
                email,
                password,
            };
            return this.httpApi.postUriEncoded("/api/account/createPassword", args);
        }

        signIn(email: string, password: string, staySignedIn: boolean): ng.IPromise<SignInResult> {
            let args = {
                email,
                password,
                staySignedIn,
            };
            let signInTask = this.httpApi.postUriEncoded<SignInResult>("/api/account/signIn", args);
            signInTask.then(result => {
                if (result.status === SignInStatus.Success) {
                    this.currentUser = new User(result.email!, result.roles);
                    this.signedIn.onNext(true);

                    // If we have Google Analytics, notify about the signed in user.
                    let ga = window["ga"];
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
            let args = {
                email,
                confirmCode,
            };

            return this.httpApi.postUriEncoded("/api/account/ConfirmEmail", args);
        }

        sendPasswordResetEmail(email: string): ng.IPromise<Server.IResetPasswordResult> {
            let args = {
                email,
            };
            return this.httpApi.postUriEncoded("/api/account/sendResetPasswordEmail", args);
        }

        resetPassword(email: string,
                      passwordResetCode: string,
                      newPassword: string): ng.IPromise<Server.IResetPasswordResult> {
            let args = {
                email,
                passwordResetCode,
                newPassword,
            };
            return this.httpApi.postUriEncoded("/api/account/resetPassword", args);
        }
    }

    App.service("accountApi", AccountService);
}
