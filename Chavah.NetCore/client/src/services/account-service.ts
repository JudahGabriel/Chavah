// Temporary minimal stub. Task 6 replaces this with the real account service
// ported from the AngularJS app. The router only needs `isSignedIn` and
// `currentUser?.isAdmin` for its access guards.
export interface CurrentUser {
  isAdmin?: boolean;
}

export const accountService = {
  isSignedIn: false as boolean,
  currentUser: null as CurrentUser | null,
};
