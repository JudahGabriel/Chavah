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

        private apiUri = "/api/account";

        constructor(
            private appNav: AppNavService,
            private initConfig: Server.HomeViewModel,
            private httpApi: HttpApiService,
            private localStorageService: ng.local.storage.ILocalStorageService) {

            if (this.initConfig.user) {
                this.currentUser = new User(this.initConfig.user);
                this.signedIn.onNext(true);
            }
        }

        get isSignedIn(): boolean {
            return !!this.currentUser;
        }

        signOut(): ng.IPromise<any> {
            const signOutTask = this.httpApi.post(`${this.apiUri}/SignOut`, null);
            signOutTask
                .then(() => {
                    this.currentUser = null;
                    this.signedIn.onNext(false);
                });
            return signOutTask;
        }

        clearNotifications(): ng.IPromise<number> {
            return this.httpApi.post(`${this.apiUri}/clearNotifications`, null);
        }

        register(email: string, password: string): ng.IPromise<Server.RegisterResults> {
            const args = {
                email,
                password,
            };
            return this.httpApi.postUriEncoded(`${this.apiUri}/register`, args);
        }

        getUserWithEmail(email: string | null): ng.IPromise<Server.AppUser | null> {
            const args = {
                email,
            };
            return this.httpApi.query<Server.AppUser | null>(`${this.apiUri}/getUserWithEmail`, args);
        }

        createPassword(email: string, password: string): ng.IPromise<any> {
            const args = {
                email,
                password,
            };
            return this.httpApi.postUriEncoded(`${this.apiUri}/createPassword`, args);
        }

        signIn(email: string, password: string, staySignedIn: boolean): ng.IPromise<Server.SignInResult> {
            const args = {
                email,
                password,
                staySignedIn,
            };
            const signInTask = this.httpApi.postUriEncoded<Server.SignInResult>(`${this.apiUri}/signIn`, args);
            signInTask.then(result => {
                if (result.status === SignInStatus.Success && result.user) {
                    this.currentUser = new User(result.user);
                    this.signedIn.onNext(true);

                    // If we have Google Analytics, notify about the signed in user.
                    const ga = window["ga"];
                    if (ga) {
                        ga("set", "userId", result.user.email);
                    }
                } else {
                    this.currentUser = null;
                    this.signedIn.onNext(false);
                }
            });

            return signInTask;
        }

        confirmEmail(email: string, confirmCode: string): ng.IPromise<Server.ConfirmEmailResult> {
            const args = {
                email,
                confirmCode,
            };

            return this.httpApi.postUriEncoded(`${this.apiUri}/ConfirmEmail`, args);
        }

        sendPasswordResetEmail(email: string): ng.IPromise<Server.ResetPasswordResult> {
            const args = {
                email,
            };
            return this.httpApi.postUriEncoded(`${this.apiUri}/sendResetPasswordEmail`, args);
        }

        resetPassword(email: string,
                      passwordResetCode: string,
                      newPassword: string): ng.IPromise<Server.ResetPasswordResult> {
            const args = {
                email,
                passwordResetCode,
                newPassword,
            };
            return this.httpApi.postUriEncoded(`${this.apiUri}/resetPassword`, args);
        }
    }

    App.service("accountApi", AccountService);
}
