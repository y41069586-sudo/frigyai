const SPLASH_LOGIN_NEW_USER_KEY = "frigy_splash_login_new_user";

export function markSplashLoginNewUser(): void {
  try {
    sessionStorage.setItem(SPLASH_LOGIN_NEW_USER_KEY, "1");
  } catch {
    // ignore
  }
}

export function isSplashLoginNewUser(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_LOGIN_NEW_USER_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearSplashLoginNewUser(): void {
  try {
    sessionStorage.removeItem(SPLASH_LOGIN_NEW_USER_KEY);
  } catch {
    // ignore
  }
}
