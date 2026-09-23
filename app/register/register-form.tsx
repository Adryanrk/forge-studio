"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { register, type AuthFormState } from "@/lib/actions/auth";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

type Field = "name" | "email" | "password";

export function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const registerWithRedirect = register.bind(null, redirectTo);
  const [state, formAction, pending] = useActionState(registerWithRedirect, initialState);

  // Every field is bound to state. React 19 resets *uncontrolled* fields after
  // a form action finishes, which is what used to wipe name/email whenever the
  // server rejected the password. Controlled values survive that reset.
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    password: false,
  });

  // Same schema the server action uses, so client and server can't disagree.
  const parsed = registerSchema.safeParse(values);
  const clientErrors: Partial<Record<Field, string>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as Field;
      if (!clientErrors[key]) clientErrors[key] = issue.message;
    }
  }

  function setField(field: Field, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }
  function touch(field: Field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  // A field shows its error once it's been blurred, or (for the password)
  // as soon as the user has typed something too short. Server-side errors
  // are shown as well and cleared as soon as that field is edited again.
  const [serverErrorsDismissed, setServerErrorsDismissed] = useState<Partial<Record<Field, boolean>>>({});
  function errorFor(field: Field): string | undefined {
    const server = serverErrorsDismissed[field] ? undefined : state.fieldErrors?.[field]?.[0];
    if (server) return server;
    const showClient = touched[field] || (field === "password" && values.password.length > 0);
    return showClient ? clientErrors[field] : undefined;
  }

  function handleChange(field: Field, value: string) {
    setField(field, value);
    setServerErrorsDismissed((prev) => ({ ...prev, [field]: true }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!parsed.success) {
      // Don't send a request we already know is invalid — reveal what's wrong.
      event.preventDefault();
      setTouched({ name: true, email: true, password: true });
      return;
    }
    setServerErrorsDismissed({});
  }

  if (state.info) {
    return <p className="text-sm text-foreground">{state.info}</p>;
  }

  const nameError = errorFor("name");
  const emailError = errorFor("email");
  const passwordError = errorFor("password");

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={values.name}
          onChange={(event) => handleChange("name", event.target.value)}
          onBlur={() => touch("name")}
          aria-invalid={!!nameError}
        />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(event) => handleChange("email", event.target.value)}
          onBlur={() => touch("email")}
          aria-invalid={!!emailError}
        />
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={values.password}
          onChange={(event) => handleChange("password", event.target.value)}
          onBlur={() => touch("password")}
          aria-invalid={!!passwordError}
          aria-describedby="password-help"
        />
        {/* Requirement is visible up front; it turns into the error in place. */}
        <p
          id="password-help"
          className={passwordError ? "text-xs text-destructive" : "text-[11px] text-muted-foreground"}
        >
          {passwordError ?? "At least 8 characters."}
        </p>
      </div>

      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-accent underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
