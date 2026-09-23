"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  info?: string;
}

export async function login(
  redirectTo: string,
  _prevState: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message,
    };
  }

  redirect(redirectTo || "/mina-bokningar");
}

export async function register(
  redirectTo: string,
  _prevState: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });

  if (error) {
    return {
      error:
        error.message === "User already registered"
          ? "An account with that email already exists."
          : error.message,
    };
  }

  // If the Supabase project requires email confirmation, signUp succeeds
  // but returns no session — there's nothing to redirect into yet.
  if (!data.session) {
    return {
      info: "Account created! Check your email to confirm your account before logging in.",
    };
  }

  redirect(redirectTo || "/mina-bokningar");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
