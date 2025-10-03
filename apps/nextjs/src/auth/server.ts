import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { initAuth } from "@acme/auth";

import { env } from "~/env";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const baseUrl =
  env.VERCEL_ENV === "production"
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : env.VERCEL_ENV === "preview"
      ? `https://${env.VERCEL_URL}`
      : env.AUTH_BASE_URL ?? "http://localhost:3000";

export const auth = initAuth({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  baseUrl,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  productionUrl:
    env.VERCEL_ENV === "production"
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : env.AUTH_PRODUCTION_URL ?? "http://localhost:3000",
  secret: env.AUTH_SECRET,
  discordClientId: env.AUTH_DISCORD_ID,
  discordClientSecret: env.AUTH_DISCORD_SECRET,
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
