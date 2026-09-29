import { getLoginFrontHref } from "./navigation";

/** End the local cookie session without contacting a second BFF. */
export async function logoutAndRedirect() {
  const loginHref = getLoginFrontHref();
  if (!loginHref) throw new Error("Login frontend URL is unavailable");

  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Local logout failed");

  window.location.replace(loginHref);
}
