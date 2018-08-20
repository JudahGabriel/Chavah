namespace BitShuva.Chavah {
    export class AccountService {

        static $inject = [
            "httpApi",
        ];

        currentUser: User | null;
        signedIn = new Rx.BehaviorSubject<boolean>(false);

        private apiUri = "/api/account";

        constructor(private httpApi: HttpApiService) {

            if (this.currentUser == null) {
                this.getUser().then(result => {
                    this.currentUser = new User(result); 
                    if (this.currentUser) {
                        this.signedIn.onNext(true);
                    }
                });
            }
           
        }

        get isSignedIn(): boolean {
            return !!this.currentUser;
        }

        getUser(): ng.IPromise<Server.IUserViewModel> {

            const getUsetTask = this.httpApi.query<Server.IUserViewModel>(`${this.apiUri}/GetUser`);

            getUsetTask
                .then(result => {
                    this.currentUser = new User(result);
                    this.signedIn.onNext(true);
                })

            return getUsetTask;
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

        register(registerModel: Server.IRegisterModel): ng.IPromise<Server.IRegisterResults> {
           return this.httpApi.post(`${this.apiUri}/register`, registerModel);
        }

        getUserWithEmail(email: string | null): ng.IPromise<Server.IUserViewModel | null> {
            const args = {
                email,
            };
            return this.httpApi.query<Server.IUserViewModel | null>(`${this.apiUri}/getUserWithEmail`, args);
        }

        createPassword(email: string, password: string): ng.IPromise<any> {
            const args = {
                email,
                password,
            };
            return this.httpApi.postUriEncoded(`${this.apiUri}/createPassword`, args);
        }

        signIn(signInModel: Server.ISignInModel): ng.IPromise<Server.ISignInResult> {
          
            const signInTask = this.httpApi.post<Server.ISignInResult>(`${this.apiUri}/signIn`, signInModel);
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

        sendSupportMessage(name: string, email: string, message: string, userAgent: string): ng.IPromise<any> {
            const args = {
                name,
                email,
                message,
                date: new Date().toISOString(),
                userAgent: window.navigator.userAgent
            };
            return this.httpApi.post(`${this.apiUri}/sendSupportMessage`, args);
        }
    }

    App.service("accountApi", AccountService);
}
