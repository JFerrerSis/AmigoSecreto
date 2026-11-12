import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Cambia el nombre con el que apareces en tus salas.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <ProfileForm />
    </div>
  );
}
