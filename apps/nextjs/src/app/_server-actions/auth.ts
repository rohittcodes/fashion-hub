"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/auth/server";

export async function signInDiscordAction() {
  const res = await auth.api.signInSocial({
    body: { provider: "discord", callbackURL: "/" },
    headers: await headers(),
  });
  if (res.url) {
    redirect(res.url);
  }
}
