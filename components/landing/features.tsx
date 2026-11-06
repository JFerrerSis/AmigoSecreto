import {
  CalendarClock,
  Link2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

function ExclusionVisual() {
  return (
    <div className="mt-6 space-y-2.5">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-3.5 py-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-pine/10 text-xs font-bold text-pine-deep">
          LG
        </span>
        <span className="text-sm font-semibold text-ink">Luis</span>
        <span className="mx-auto text-[11px] font-bold uppercase tracking-[0.12em] text-terra">
          no puede con
        </span>
        <span className="text-sm font-semibold text-ink">Mariana</span>
        <span className="flex size-8 items-center justify-center rounded-full bg-terra/10 text-xs font-bold text-terra-deep">
          MG
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-3.5 py-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-[#7a571a]">
          AN
        </span>
        <span className="text-sm font-semibold text-ink">Andrea</span>
        <span className="mx-auto text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          pareja
        </span>
        <span className="text-sm font-semibold text-ink">Diego</span>
        <span className="flex size-8 items-center justify-center rounded-full bg-sand text-xs font-bold text-ink">
          DG
        </span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="privacidad" className="scroll-mt-24 border-t border-line/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
            Pensado para grupos reales
          </p>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] tracking-[-0.02em] text-ink sm:text-5xl">
            Las reglas importan. La privacidad, también.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Desde parejas que no deben regalarse entre sí hasta un cupo máximo de
            invitados. Configura una vez y deja que la app se encargue del resto.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-3xl border border-line bg-paper p-6 shadow-soft md:col-span-2">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-terra/10 text-terra-deep">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h3 className="mt-6 font-display text-3xl leading-tight text-ink">
              Exclusiones que de verdad se respetan
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              Bloquea parejas, familiares o cualquier combinación incómoda. El
              algoritmo valida cada asignación antes de guardar el resultado.
            </p>
            <ExclusionVisual />
          </article>

          <article className="rounded-3xl border border-line bg-pine p-6 text-paper shadow-soft">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-paper/10 text-gold">
              <LockKeyhole className="size-5" aria-hidden />
            </span>
            <h3 className="mt-6 font-display text-3xl leading-tight">
              Privacidad por diseño
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-paper/70">
              La base local solo entrega a cada participante la asignación donde
              él es el que regala. Ni el organizador recibe todas las parejas.
            </p>
            <div className="mt-8 rounded-2xl border border-paper/15 bg-paper/5 px-4 py-3 font-mono text-[11px] leading-relaxed text-paper/65">
              draw.giver_id === session.user.id
            </div>
          </article>

          <article className="rounded-3xl border border-line bg-paper p-6 shadow-soft">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gold/20 text-[#7a571a]">
              <Mail className="size-5" aria-hidden />
            </span>
            <h3 className="mt-6 font-display text-2xl leading-tight text-ink">
              Avisos automáticos
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Al terminar el sorteo, envía un correo a cada participante con el
              link directo a su sala. Sin perseguir a nadie por WhatsApp.
            </p>
          </article>

          <article className="rounded-3xl border border-line bg-paper p-6 shadow-soft">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-pine/10 text-pine">
              <Users className="size-5" aria-hidden />
            </span>
            <h3 className="mt-6 font-display text-2xl leading-tight text-ink">
              Lista en vivo
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Mira quién se va uniendo en tiempo real. Comparte el enlace y el
              contador de cupo se actualiza solo.
            </p>
          </article>

          <article className="rounded-3xl border border-line bg-paper p-6 shadow-soft">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-cream text-pine">
              <Wallet className="size-5" aria-hidden />
            </span>
            <h3 className="mt-6 font-display text-2xl leading-tight text-ink">
              Presupuesto claro</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Define un rango y una moneda. Todos ven exactamente cuánto gastar
              al revelar su amigo secreto.
            </p>
          </article>

          <article className="rounded-3xl border border-line bg-paper p-6 shadow-soft md:col-span-2 lg:col-span-3">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pine/10 text-pine">
                  <Link2 className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-2xl leading-tight text-ink">
                    Un link. Todos adentro.
                  </h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
                    El enlace de invitación es único por sala. Si alguien aún no
                    tiene identidad local, la crea y vuelve automáticamente a la
                    sala.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-2">
                  <CalendarClock className="size-4 text-pine" aria-hidden />
                  Fecha límite
                </span>
                <span className="inline-flex items-center gap-2">
                  <LockKeyhole className="size-4 text-pine" aria-hidden />
                  Acceso seguro
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
