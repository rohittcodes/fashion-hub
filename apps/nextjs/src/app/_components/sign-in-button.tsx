"use client";

import { Button } from "@acme/ui/button";

import { signInDiscordAction } from "~/app/_server-actions/auth";

export function SignInButton() {
  return (
    <form action={signInDiscordAction}>
      <Button variant="primary" type="submit">
        Sign in
      </Button>
    </form>
  );
}
