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
            var args = {
                email: email,
                password: password
            };
            return this.httpApi.postUriEncoded("/api/account/register", args);
        }

        getUserWithEmail(email: string): ng.IPromise<Server.IAppUser | null> {
            var args = {
                email: email
            };
            return this.httpApi.query<Server.IAppUser | null>("/api/account/getUserWithEmail", args);
        }

        createPassword(email: string, password: string): ng.IPromise<any> {
            var args = {
                email: email,
                password: password
            };
            return this.httpApi.postUriEncoded("/api/account/createPassword", args);
        }

        signIn(email: string, password: string, staySignedIn: boolean): ng.IPromise<SignInResult> {
            var args = {
                email: email,
                password: password,
                staySignedIn: staySignedIn
            };
            var signInTask = this.httpApi.postUriEncoded<SignInResult>("/api/account/signIn", args);
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
            var args = {
                email: email,
                confirmCode: confirmCode
            };
            
            return this.httpApi.postUriEncoded("/api/account/ConfirmEmail", args);
        }

        sendPasswordResetEmail(email: string): ng.IPromise<Server.IResetPasswordResult> {
            var args = {
                email: email
            };
            return this.httpApi.postUriEncoded("/api/account/sendResetPasswordEmail", args);
        }

        resetPassword(email: string, passwordResetCode: string, newPassword: string): ng.IPromise<Server.IResetPasswordResult> {
            var args = {
                email: email,
                passwordResetCode: passwordResetCode,
                newPassword: newPassword
            };
            return this.httpApi.postUriEncoded("/api/account/resetPassword", args);
        }
    }

    App.service("accountApi", AccountService);
}