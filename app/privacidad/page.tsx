import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos usa Amigo Secreto, para qué sirven y cómo puedes ejercer tus derechos.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro="Queremos que sepas qué datos usamos, por qué los necesitamos y cómo puedes controlarlos. Sin letras chiquitas."
    >
      <LegalSection title="1. Quién trata tus datos">
        <p>
          Amigo Secreto trata los datos que compartes para que puedas organizar
          intercambios de regalos y participar en ellos.
        </p>
      </LegalSection>

      <LegalSection title="2. Qué datos usamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>Tu nombre y correo, para crear y reconocer tu cuenta.</li>
          <li>Tu contraseña, guardada como hash bcrypt.</li>
          <li>Las salas que creas o a las que te unes.</li>
          <li>Las reglas de la sala: presupuesto, fecha, cupo y exclusiones.</li>
          <li>Tu asignación del sorteo, que solo tú puedes ver.</li>
          <li>
            Tus listas de deseos, regalos y notas en cada sala, visibles para
            sus miembros.
          </li>
          <li>
            Los nombres y correos de las personas que invitas, cuando tú los
            agregas.
          </li>
          <li>
            Si el organizador bloquea a alguien, guardamos la relación entre esa
            persona y la sala para impedir su reingreso hasta que la desbloquee.
          </li>
        </ul>
        <p>
          Para entrar usamos tu correo y contraseña. También usamos una cookie
          necesaria que mantiene tu sesión iniciada.
        </p>
      </LegalSection>

      <LegalSection title="3. Para qué usamos tus datos">
        <ul className="list-disc space-y-2 pl-5">
          <li>Crear tu cuenta y reconocerte cuando vuelves.</li>
          <li>Mostrarte tus salas, participantes y resultados.</li>
          <li>Compartir tu lista de deseos con los miembros de la sala.</li>
          <li>Permitir que actualices tu nombre de perfil.</li>
          <li>Mantener la app funcionando y prevenir usos indebidos.</li>
        </ul>
        <p>
          No vendemos tus datos ni los usamos para publicidad de terceros. Las
          asignaciones del sorteo se consultan dentro de la sala; no enviamos la
          asignación por correo.
        </p>
      </LegalSection>

      <LegalSection title="4. Con quién compartimos información">
        <p>
          Usamos proveedores que nos ayudan a alojar la app y guardar la
          información. Solo acceden a lo necesario para prestar el servicio.
        </p>
        <p>
          También podemos compartir información si la ley nos lo exige o si es
          necesario para proteger a las personas que usan la app.
        </p>
      </LegalSection>

      <LegalSection title="5. Cuánto tiempo conservamos los datos">
        <p>
          Conservamos tus datos mientras uses la app y mientras sea necesario
          para prestarte el servicio. Si dejas de usarla, podemos conservar
          información mínima para cumplir obligaciones legales o resolver
          disputas.
        </p>
      </LegalSection>

      <LegalSection title="6. Tus derechos">
        <p>
          Puedes solicitar acceso, corrección o eliminación de tus datos, así
          como oponerte a ciertos usos. Para hacerlo, usa el canal de contacto
          del organizador de tu sala o el medio de soporte que se te haya
          compartido.
        </p>
        <p>
          También puedes dejar de usar la app y cerrar sesión cuando quieras.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies y almacenamiento en tu navegador">
        <p>
          Usamos una cookie necesaria para mantener tu sesión y una copia
          temporal en tu navegador para que la app cargue más rápido. No usamos
          cookies de publicidad ni de seguimiento.
        </p>
        <p>
          Puedes leer los detalles en nuestra{" "}
          <Link
            href="/cookies"
            className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
          >
            política de cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Seguridad">
        <p>
          Cuidamos tus datos y limitamos el acceso a lo necesario. Ningún
          servicio puede prometer seguridad absoluta, pero trabajamos para
          proteger tu información.
        </p>
      </LegalSection>

      <LegalSection title="9. Menores de edad">
        <p>
          La app no está dirigida a menores de 13 años. Si crees que un menor
          nos compartió datos, contáctanos para revisarlo.
        </p>
      </LegalSection>

      <LegalSection title="10. Cambios a esta política">
        <p>
          Podemos actualizar esta política para reflejar cambios en la app.
          Publicaremos la fecha de la última actualización en esta página.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
