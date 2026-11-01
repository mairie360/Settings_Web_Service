import { createSessionLogoutProxy } from '@mairie360/lib-components/next';
export const POST = createSessionLogoutProxy({ loginUrl: () => process.env.LOGIN_FRONT_URL?.trim() ?? '', frontUrl: () => process.env.SETTINGS_FRONT_URL?.trim() ?? '' });
