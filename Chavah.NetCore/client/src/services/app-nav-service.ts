// Temporary minimal stub. Task 6 replaces this with the real navigation service.
// `signIn()` sends the user to the sign-in screen. It calls `navigateTo` at
// runtime (not import time) so the circular import with the router is safe.
import { navigateTo } from "../shared/router";

export const appNav = {
  signIn() { navigateTo("/signin"); },
};
