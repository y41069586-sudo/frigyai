/** Local Vite dev port — keep in sync with vite.config.ts `server.port`. */
export const DEV_SERVER_PORT = 4137;

export const LOCAL_DEV_ORIGIN = `http://localhost:${DEV_SERVER_PORT}`;

export const LOCAL_OAUTH_REDIRECT = `${LOCAL_DEV_ORIGIN}/auth`;
