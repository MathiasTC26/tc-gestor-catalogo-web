"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  FilePenLine,
  FilePlus2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

export default function HomePage() {
  useEffect(() => {
    cleanSensitiveUrlParams();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#101011] px-3 py-4 text-[#221d20] sm:px-5 lg:px-7">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-18%,rgba(255,255,255,.08),transparent_32%),linear-gradient(180deg,#151416_0%,#101011_72%)]" />

      <section className="relative mx-auto w-full max-w-[1120px] rounded-[30px] border border-white/35 bg-[linear-gradient(145deg,#e4dfe1,#d5d0d2_62%,#cbc5c8)] p-3 shadow-[0_34px_90px_rgba(0,0,0,.42),inset_0_1px_0_rgba(255,255,255,.75)] sm:p-5">
        <header className="tc-sheen relative overflow-hidden rounded-[26px] bg-[#232124] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:p-5">
          <div className="relative z-10 grid gap-4 sm:grid-cols-[104px_1fr] sm:items-center">
            <div className="grid h-[88px] w-[88px] place-items-center rounded-[24px] border border-white/25 bg-white p-3 shadow-[0_20px_38px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.65)] sm:h-[104px] sm:w-[104px]">
              <img
                src="/Todo-Costura.png"
                alt="Todo Costura"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#d9b9c9]">
                Centro operativo
              </p>
              <h1 className="mt-1 text-[38px] font-black leading-[0.9] tracking-[-0.075em] text-[#f4f1f3] sm:text-[58px] lg:text-[70px]">
                Gestión de revista
              </h1>
              <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#f4f1f3]/68 sm:text-[15px]">
                Elegí el área de trabajo y ejecutá la acción correspondiente
                desde el nuevo flujo web.
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 rounded-[25px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#e9e4e6,#ded9db)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.52)] sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A52E64]">
            Revista
          </p>
          <h2 className="mt-1 text-[32px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22] sm:text-[44px]">
            Acciones disponibles
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#655c61]">
            Seleccioná una opción para comenzar a gestionar la revista sin
            depender del flujo viejo de Creator.
          </p>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <ActionCard
            href="/create"
            label="Principal"
            title="Crear revista"
            description="Registrá una revista nueva, configurá sus datos principales y preparala para añadir productos."
            access="Nueva publicación"
            icon={<FilePlus2 />}
          />
          <ActionCard
  href="https://tc-gestor-revista-api.todocostura.workers.dev/api/revista/session/create?action=editar"
  label="Gestión"
  title="Editar revista"
  description="Actualizá datos, configuraciones y detalles de una revista existente dentro del nuevo sistema web."
  access="Publicación existente"
  icon={<FilePenLine />}
/>
        </section>
      </section>
    </main>
  );
}

function ActionCard({
  href,
  label,
  title,
  description,
  access,
  icon,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
  access: string;
  icon: ReactNode;
}) {
  return (
    <article className="group rounded-[24px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-4 shadow-[0_16px_38px_rgba(0,0,0,.13),inset_0_1px_0_rgba(255,255,255,.54)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.58)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.55)] [&_svg]:h-6 [&_svg]:w-6">
            {icon}
          </div>
          <h3 className="min-w-0 text-[26px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22] sm:text-[30px]">
            {title}
          </h3>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#A52E64] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#f7f2f4] shadow-[0_10px_20px_rgba(165,46,100,.22)]">
          {label}
          <Sparkles className="h-3 w-3" />
        </span>
      </div>

      <div className="mt-4 h-[3px] w-12 rounded-full bg-[#A52E64]" />
      <p className="mt-4 min-h-[54px] text-[13px] font-bold leading-relaxed text-[#655c61]">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-3 border-t border-dashed border-[#bdb5b9] pt-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#A52E64]/10 text-[#A52E64]">
          <LockKeyhole className="h-4 w-4" />
        </div>
        <div>
          <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#A52E64]">
            Acceso
          </span>
          <span className="mt-0.5 block text-[12px] font-bold text-[#655c61]">
            {access}
          </span>
        </div>
      </div>

      <Link
        href={href}
        className="tc-primary-button mt-5 flex w-full items-center justify-center gap-2 no-underline"
      >
        Abrir
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </article>
  );
}

function cleanSensitiveUrlParams(paramsToRemove = ["flow", "tk", "v"]) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  let changed = false;

  for (const param of paramsToRemove) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }

  if (!changed) return;

  const cleanUrl =
    url.pathname +
    (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") +
    url.hash;

  window.history.replaceState(null, "", cleanUrl);
}