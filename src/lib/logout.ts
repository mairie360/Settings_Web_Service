import { getLoginFrontHref } from "./navigation";

/** Hand off to Login, the only frontend configured to expire the shared cookie. */
export async function logoutAndRedirect() {
  const loginHref = getLoginFrontHref();
  if (!loginHref) throw new Error("Login frontend URL is unavailable");
  window.location.replace(new URL("/logout", loginHref).href);
}
