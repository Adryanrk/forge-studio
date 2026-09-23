import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo || "/mina-bokningar");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium tracking-[0.3em] text-accent uppercase">Join</p>
          <h1 className="mt-3 font-heading text-3xl text-foreground">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up to book sessions at Forge.
          </p>
          <div className="mt-8">
            <RegisterForm redirectTo={redirectTo ?? ""} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
