"use client";

import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { useLocalUser } from "@/hooks/use-local-user";

export default function HomePage() {
  const { user } = useLocalUser();
  const signedIn = Boolean(user);

  return (
    <>
      <Hero signedIn={signedIn} />
      <HowItWorks />
      <Features />
      <FinalCta signedIn={signedIn} />
    </>
  );
}
