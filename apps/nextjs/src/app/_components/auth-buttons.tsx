"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

import { useTRPC } from "~/trpc/react";
import { SignInButton } from "./sign-in-button";

export function AuthButtons() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const trpc = useTRPC();
  const { data: session } = useSuspenseQuery(
    trpc.auth.getSession.queryOptions(),
  );
  const isAuthed = !!session?.user;

  if (!mounted) {
    // stable placeholder to avoid SSR/CSR text mismatch
    return <div style={{ width: 180, height: 36 }} />;
  }

  if (isAuthed) {
    return (
      <>
        <Link href="/profile">
          <Button variant="ghost">Profile</Button>
        </Link>
        <form action="/api/auth/sign-out" method="post">
          <Button variant="outline" type="submit">Sign out</Button>
        </form>
      </>
    );
  }

  return <SignInButton />;
}



