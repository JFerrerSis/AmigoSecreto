"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Hash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CODE_PATTERN = /^[A-Z0-9_-]{6,32}$/;

export function JoinByCodeForm({ className }: { className?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");

    if (!CODE_PATTERN.test(cleanCode)) {
      setError("Escribe un código de sala válido.");
      return;
    }

    router.push(`/join/${encodeURIComponent(cleanCode)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full", className)}
      noValidate
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Hash
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError("");
            }}
            placeholder="EJ. ABC12345"
            aria-label="Código de sala"
            aria-invalid={Boolean(error)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={32}
            className="pl-11 font-mono uppercase tracking-[0.12em]"
          />
        </div>
        <Button type="submit" size="lg" className="sm:w-auto">
          Unirme
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-xs font-medium text-terra-deep">{error}</p>
      ) : null}
    </form>
  );
}
