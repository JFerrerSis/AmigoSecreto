import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Uso de cookies",
  description:
    "Qué cookies usa Amigo Secreto, para qué sirven y cómo puedes controlarlas.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Uso de cookies"
      intro="Usamos lo mínimo necesario para que tu sesión funcione. Aquí te explicamos qué guardamos y para qué."
    >
      <LegalSection title="1. Qué son las cookies">
        <p>
          Las cookies son pequeños archivos que tu navegador guarda cuando
          visitas un sitio. Sirven para recordar información entre una visita y
          otra, como el hecho de que ya iniciaste sesión.
        </p>
      </LegalSection>

      <LegalSection title="2. La cookie que usamos">
        <p>
          Usamos una sola cookie necesaria para mantener tu sesión iniciada.
          Gracias a ella sabemos qué cuenta está usando la app y podemos
          mostrarte tus salas y resultados.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-ink">Finalidad:</span> recordar
            que ya entraste a tu cuenta.
          </li>
          <li>
            <span className="font-semibold text-ink">Duración:</span> hasta 30
            días o hasta que cierres sesión.
          </li>
          <li>
            <span className="font-semibold text-ink">Tipo:</span> necesaria.
          </li>
        </ul>
        <p>
          Sin esta cookie tendrías que volver a identificarte en cada visita.
        </p>
      </LegalSection>

      <LegalSection title="3. Lo que no hacemos">
        <p>
          No usamos cookies de publicidad, análisis ni seguimiento de terceros.
          Tampoco vendemos tus datos.
        </p>
      </LegalSection>

      <LegalSection title="4. Copia temporal en tu navegador">
        <p>
          Además de la cookie, tu navegador puede guardar una copia temporal de
          tu perfil y tus salas para que la app cargue más rápido. Esa copia se
          queda en tu dispositivo y puedes borrarla desde la configuración de tu
          navegador.
        </p>
      </LegalSection>

      <LegalSection title="5. Cómo controlar las cookies">
        <p>
          Puedes bloquear o eliminar cookies desde la configuración de tu
          navegador. Si bloqueas la cookie de sesión, no podrás mantener tu
          sesión iniciada.
        </p>
        <p>
          Si borras las cookies, tendrás que volver a ingresar con tu correo la
          próxima vez.
        </p>
      </LegalSection>

      <LegalSection title="6. Más información">
        <p>
          Para saber cómo tratamos tus datos, consulta nuestra{" "}
          <Link
            href="/privacidad"
            className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
          >
            política de privacidad
          </Link>{" "}
          y nuestros{" "}
          <Link
            href="/terminos"
            className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
          >
            Términos de uso
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
