import { createAuthGuard } from '@mairie360/lib-components/guard';
import contract from '../contracts/openapi.json';
export const middleware = createAuthGuard({
  paths: contract.paths,
  frontUrl: () => process.env.SETTINGS_FRONT_URL?.trim() ?? '',
  loginUrl: () => process.env.LOGIN_FRONT_URL?.trim() ?? '',

});
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)", "/openapi.json", "/swagger.json"],
};
