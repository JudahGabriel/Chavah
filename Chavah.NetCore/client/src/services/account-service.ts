import { httpApi } from "./http-api-service";
import { User } from "../models/user";
import { SignInStatus } from "../models/sign-in-status";
import { getHomeViewModel } from "../shared/home-view-model";
import { BehaviorSubject } from "../shared/reactive-store";
import type {
  User as ServerUser,
  IRegisterModel,
  IRegisterResults,
  ISignInModel,
  ISignInResult,
  ConfirmEmailResult,
  ResetPasswordResult,
} from "../models/server-interfaces";

/**
 * Manages the signed-in user and account-related API calls. Ported from the
 * AngularJS `AccountService`; `$http`/`$q` become the fetch-based `httpApi`,
 * `Rx.BehaviorSubject` becomes our reactive-store `BehaviorSubject`, and the
 * initial user is read from the server-injected home view model.
 */
export class AccountService {
  currentUser: User | null;
  readonly signedInState: BehaviorSubject<boolean>;
  private readonly apiUri = "/api/account";

  constructor() {
    const initialUser = getHomeViewModel().user;
    this.signedInState = new BehaviorSubject<boolean>(!!initialUser);
    this.currentUser = initialUser ? new User(initialUser) : null;
  }

  get isSignedIn(): boolean {
    return !!this.currentUser && !!this.currentUser.email;
  }

  signOut(): Promise<any> {
    const signOutTask = httpApi.post(`${this.apiUri}/signOut`, null);
    signOutTask.then(() => {
      this.currentUser = null;
      this.signedInState.onNext(false);
    });
    return signOutTask;
  }

  clearNotifications(): Promise<number> {
    return httpApi.post(`${this.apiUri}/clearNotifications`, null);
  }

  register(registerModel: IRegisterModel): Promise<IRegisterResults> {
    return httpApi.post(`${this.apiUri}/register`, registerModel);
  }

  getUserWithEmail(email: string | null): Promise<ServerUser | null> {
    const args = { email };
    return httpApi.query<ServerUser | null>(`${this.apiUri}/getUserWithEmail`, args);
  }

  createPassword(email: string, password: string): Promise<any> {
    const args = { email, password };
    return httpApi.postUriEncoded(`${this.apiUri}/createPassword`, args);
  }

  signIn(signInModel: ISignInModel): Promise<ISignInResult> {
    const signInTask = httpApi.post<ISignInResult>(`${this.apiUri}/signIn`, signInModel);
    signInTask.then((result) => {
      if (result.status === SignInStatus.Success && result.user) {
        this.currentUser = new User(result.user);
        this.signedInState.onNext(true);

        // If we have Google Analytics, notify about the signed in user.
        const ga = (window as unknown as Record<string, unknown>)["ga"] as
          | ((...args: unknown[]) => void)
          | undefined;
        if (ga) {
          ga("set", "userId", result.user.email);
        }
      } else {
        this.currentUser = null;
        this.signedInState.onNext(false);
      }
    });

    return signInTask;
  }

  confirmEmail(email: string, confirmCode: string): Promise<ConfirmEmailResult> {
    const args = { email, confirmCode };
    return httpApi.postUriEncoded(`${this.apiUri}/confirmEmail`, args);
  }

  sendPasswordResetEmail(email: string): Promise<ResetPasswordResult> {
    const args = { email };
    return httpApi.postUriEncoded(`${this.apiUri}/sendResetPasswordEmail`, args);
  }

  resetPassword(email: string, passwordResetCode: string, newPassword: string): Promise<ResetPasswordResult> {
    const args = { email, passwordResetCode, newPassword };
    return httpApi.postUriEncoded(`${this.apiUri}/resetPassword`, args);
  }

  sendSupportMessage(name: string, email: string, message: string, _userAgent: string): Promise<any> {
    const args = {
      name,
      email,
      message,
      date: new Date().toISOString(),
      userAgent: window.navigator.userAgent,
    };
    return httpApi.post(`${this.apiUri}/sendSupportMessage`, args);
  }

  resendConfirmationEmail(email: string): Promise<any> {
    const args = { email };
    return httpApi.post(`${this.apiUri}/resendConfirmationEmail`, args);
  }

  deleteAccount(): Promise<any> {
    return httpApi.post(`${this.apiUri}/deleteMyAccount`, {});
  }

  migrateUserEmail(oldEmail: string, newEmail: string): Promise<unknown> {
    return httpApi.post(`${this.apiUri}/migrateAccount`, { oldEmail, newEmail });
  }
}

export const accountService = new AccountService();
