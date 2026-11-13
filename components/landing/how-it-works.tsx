import { CalendarClock, Link2, Users } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: CalendarClock,
    title: "Configura la sala",
    description:
      "Define el presupuesto, el cupo, la fecha límite y el nombre del evento. Todo en una sola pantalla.",
  },
  {
    number: "02",
    icon: Link2,
    title: "Invita con un link",
    description:
      "Comparte el enlace único. Tus invitados crean su cuenta con correo y contraseña, y aparecen en la lista al instante.",
  },
  {
    number: "03",
    icon: Users,
    title: "Sorteo y revelación",
    description:
      "Ejecuta el sorteo respetando exclusiones. Cada participante revela su asignación de forma privada.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 border-t border-line/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
              Así de simple
            </p>
            <h2 className="mt-3 max-w-xl font-display text-4xl leading-[1.02] tracking-[-0.02em] text-ink sm:text-5xl">
              Tres pasos. Cero hojas de cálculo.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            El caos de organizar un intercambio se queda fuera. Tu grupo solo ve
            lo que necesita ver.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="group relative overflow-hidden rounded-3xl border border-line bg-paper p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-cream text-pine transition-colors group-hover:bg-pine group-hover:text-paper">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-4xl leading-none text-line transition-colors group-hover:text-gold">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-2xl leading-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>

                {index < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute -right-px top-1/2 hidden h-px w-4 bg-line md:block"
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
