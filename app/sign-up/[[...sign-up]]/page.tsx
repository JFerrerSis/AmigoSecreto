import type { Metadata } from "next";

import { LocalAuthForm } from "@/components/auth/local-auth-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

function safeRedirect(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;

  return "/dashboard";
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirectUrl = safeRedirect(params.redirect_url);

  return (
    <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center px-5 py-16">
      <LocalAuthForm mode="sign-up" redirectUrl={redirectUrl} />
    </div>
  );
}
