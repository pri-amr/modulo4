const REQUIRED_VARS = [
  "MONGODB_URI",
  "SESSION_JWT_SECRET",
  "WEBAUTHN_RP_ID",
  "WEBAUTHN_ORIGIN",
  "DOLARAPI_BASE_URL",
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

export type Env = Record<RequiredVar, string> & { PORT: string };

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const missing = REQUIRED_VARS.filter((key) => !source[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    MONGODB_URI: source.MONGODB_URI as string,
    SESSION_JWT_SECRET: source.SESSION_JWT_SECRET as string,
    WEBAUTHN_RP_ID: source.WEBAUTHN_RP_ID as string,
    WEBAUTHN_ORIGIN: source.WEBAUTHN_ORIGIN as string,
    DOLARAPI_BASE_URL: source.DOLARAPI_BASE_URL as string,
    PORT: source.PORT ?? "4000",
  };
}
