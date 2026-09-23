"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const loginWithRedirect = login.bind(null, redirectTo);
  const [state, formAction, pending] = useActionState(loginWithRedirect, initialState);

  // Controlled fields: React 19 resets uncontrolled inputs after a form
  // action completes, so a failed login (wrong password, validation error)
  // would otherwise clear the email too.
  const [values, setValues] = useState({ email: "", password: "" });

  return (
    <form action={formAction} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
          aria-invalid={!!state.fieldErrors?.email}
        />
        {state.fieldErrors?.email?.map((error) => (
          <p key={error} className="text-xs text-destructive">
            {error}
          </p>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
          aria-invalid={!!state.fieldErrors?.password}
        />
        {state.fieldErrors?.password?.map((error) => (
          <p key={error} className="text-xs text-destructive">
            {error}
          </p>
        ))}
      </div>

      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="text-accent underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </form>
  );
}
