import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Reglas claras para organizar y participar en intercambios de regalos con Amigo Secreto.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de uso"
      intro="Estas son las reglas para usar Amigo Secreto. Están escritas para que se entiendan, no para complicarte la vida."
    >
      <LegalSection title="1. Qué es Amigo Secreto">
        <p>
          Amigo Secreto es una herramienta para organizar intercambios de
          regalos. Puedes crear una sala, invitar a tu grupo, hacer el sorteo y
          descubrir a quién te toca regalar.
        </p>
        <p>
          Al crear una cuenta o usar la app aceptas estos términos. Si no estás
          de acuerdo, no uses el servicio.
        </p>
      </LegalSection>

      <LegalSection title="2. Tu cuenta">
        <p>
          Para usar Amigo Secreto necesitas un nombre, un correo y una
          contraseña.
        </p>
        <p>
          Usa un correo al que solo tú tengas acceso y una contraseña que no
          reutilices en otros servicios. Tú eres responsable de la actividad que
          se haga desde tu cuenta.
        </p>
        <p>
          Puedes cambiar tu contraseña desde tu perfil con una sesión activa y
          cerrar sesión cuando quieras. No ofrecemos recuperación por correo ni
          OTP.
        </p>
      </LegalSection>

      <LegalSection title="3. Uso adecuado">
        <p>Al usar la app te comprometes a no:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Acosar, amenazar o suplantar a otra persona.</li>
          <li>Enviar spam o invitar a personas sin su consentimiento.</li>
          <li>Intentar acceder a información de otras cuentas o salas.</li>
          <li>Interferir con el funcionamiento del servicio.</li>
          <li>Usar la app para actividades ilegales.</li>
        </ul>
        <p>
          Si incumples estas reglas, podemos suspender o eliminar tu cuenta.
        </p>
      </LegalSection>

      <LegalSection title="4. Salas, reglas y sorteo">
        <p>
          Quien organiza una sala decide las reglas: presupuesto, fecha, cupo y
          exclusiones. También es responsable de invitar a las personas
          correctas y de explicarles las reglas.
        </p>
        <p>
          La app se encarga de hacer el sorteo. Cada participante ve únicamente
          su propia asignación dentro de la sala; no enviamos la asignación por
          correo. No podemos garantizar cómo se comporten los participantes
          después del sorteo.
        </p>
        <p>
          El organizador puede sacar a un participante antes del sorteo,
          decidir si bloquea su reingreso a la sala y desbloquearlo más adelante.
        </p>
      </LegalSection>

      <LegalSection title="5. Regalos y pagos">
        <p>
          Amigo Secreto no procesa pagos ni entrega regalos. Cualquier compra,
          acuerdo o entrega es responsabilidad de los participantes.
        </p>
      </LegalSection>

      <LegalSection title="6. Datos de otras personas">
        <p>
          Si agregas el nombre o correo de otra persona, asegúrate de tener su
          permiso. No compartas datos de otras personas sin autorización.
        </p>
        <p>
          Las listas de deseos son opcionales y visibles para los miembros de la
          sala. No incluyas información sensible ni datos de terceros sin su
          consentimiento.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilidad y cambios">
        <p>
          Podemos mejorar, modificar o suspender la app cuando sea necesario.
          Procuramos que todo funcione bien, pero no garantizamos que el
          servicio esté disponible todo el tiempo ni que no tenga errores.
        </p>
      </LegalSection>

      <LegalSection title="8. Límite de responsabilidad">
        <p>
          En la medida permitida por la ley, no somos responsables de daños
          indirectos, pérdida de información o conflictos entre participantes
          que surjan del uso de la app. Usas el servicio bajo tu propia
          responsabilidad.
        </p>
      </LegalSection>

      <LegalSection title="9. Privacidad y cookies">
        <p>
          Usamos tu nombre, correo y credenciales de acceso para crear tu cuenta
          y mostrarte tus salas y resultados. No vendemos tus datos. Puedes leer
          cómo tratamos tu información en la{" "}
          <Link
            href="/privacidad"
            className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
          >
            política de privacidad
          </Link>{" "}
          y cómo usamos las cookies en la{" "}
          <Link
            href="/cookies"
            className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
          >
            política de cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Cambios a estos términos">
        <p>
          Podemos actualizar estos términos para reflejar cambios en la app.
          Publicaremos la fecha de la última actualización en esta página. Si
          sigues usando el servicio después de un cambio, aceptas la nueva
          versión.
        </p>
      </LegalSection>

      <LegalSection title="11. Contacto">
        <p>
          Si tienes dudas sobre estos términos, usa el canal de contacto del
          organizador de tu sala o el medio de soporte que se te haya
          compartido.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
