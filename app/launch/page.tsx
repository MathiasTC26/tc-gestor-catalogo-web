"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type LaunchTarget =
  | "base"
  | "dashboard"
  | "create"
  | "edit"
  | "preview"
  | "products";

const launchCopy: Record<
  LaunchTarget,
  {
    eyebrow: string;
    title: string;
    description: string;
    statusTitle: string;
    statusText: string;
    destination: string;
  }
> = {
  base: {
    eyebrow: "Gestor de Revista",
    title: "Abriendo base",
    description: "Validando acceso desde Creator.",
    statusTitle: "Preparando sitio",
    statusText: "Conectando con la base del gestor.",
    destination: "Base",
  },
  dashboard: {
    eyebrow: "Sistema",
    title: "Abriendo panel",
    description: "Validando flujo seguro desde Creator.",
    statusTitle: "Preparando entorno seguro",
    statusText: "Conectando con el panel principal.",
    destination: "Dashboard",
  },
  create: {
    eyebrow: "Crear revista",
    title: "Preparando creación",
    description: "Inicializando un entorno limpio de trabajo.",
    statusTitle: "Configurando formulario",
    statusText: "Preparando campos y estructura base.",
    destination: "Crear",
  },
  edit: {
    eyebrow: "Editar revista",
    title: "Cargando edición",
    description: "Recuperando el contexto autorizado desde Creator.",
    statusTitle: "Validando contenido",
    statusText: "Preparando datos para edición segura.",
    destination: "Editar",
  },
  preview: {
    eyebrow: "Vista previa",
    title: "Generando preview",
    description: "Preparando una visualización controlada del contenido.",
    statusTitle: "Renderizando vista",
    statusText: "Organizando información para revisión.",
    destination: "Preview",
  },
  products: {
    eyebrow: "Productos",
    title: "Abriendo selector",
    description: "Preparando productos asociados a la revista.",
    statusTitle: "Cargando productos",
    statusText: "Conectando con el selector de productos.",
    destination: "Productos",
  },
};

function normalizeTarget(value: string | null): LaunchTarget {
  if (
    value === "base" ||
    value === "dashboard" ||
    value === "create" ||
    value === "edit" ||
    value === "preview" ||
    value === "products"
  ) {
    return value;
  }

  if (value === "inicio") return "base";
  if (value === "crear") return "create";
  if (value === "editar") return "edit";
  if (value === "visualizar") return "preview";
  if (value === "productos") return "products";

  return "base";
}

function getSafeNext(value: string | null): string | null {
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);

    if (!decoded.startsWith("/")) return null;
    if (decoded.startsWith("//")) return null;
    if (decoded.includes("://")) return null;

    return decoded;
  } catch {
    return null;
  }
}

function getFallbackNext(target: LaunchTarget): string {
  if (target === "base" || target === "dashboard") return "/";
  if (target === "create") return "/create";
  if (target === "edit") return "/edit";
  if (target === "products") return "/products";
  if (target === "preview") return "/preview";

  return "/";
}

function buildRedirectUrl(nextUrl: string, flow: string) {
  const cleanFlow = flow.trim();

  if (!cleanFlow) {
    return nextUrl;
  }

  const separator = nextUrl.includes("?") ? "&" : "?";

  return `${nextUrl}${separator}flow=${encodeURIComponent(cleanFlow)}`;
}

function LaunchContent() {
  const params = useSearchParams();

  const target = normalizeTarget(params.get("target"));
  const flow = params.get("flow")?.trim() || "";
  const nextUrl = getSafeNext(params.get("next")) ?? getFallbackNext(target);

  const copy = launchCopy[target];

  const [progress, setProgress] = useState(8);
  const [label, setLabel] = useState("Preparando entorno...");

  useEffect(() => {
    let frame = 0;
    const startedAt = Date.now();
    const duration = 1800;

    function update() {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      const nextProgress = Math.min(8 + eased * 92, 100);

      setProgress(nextProgress);

      if (nextProgress < 45) {
        setLabel("Validando acceso...");
      } else if (nextProgress < 82) {
        setLabel(copy.statusText);
      } else {
        setLabel("Abriendo destino...");
      }

      if (ratio < 1) {
        frame = window.requestAnimationFrame(update);
        return;
      }

      window.setTimeout(() => {
        if (flow) {
          sessionStorage.setItem("revista_flow", flow);
        }

        window.location.href = buildRedirectUrl(nextUrl, flow);
      }, 220);
    }

    frame = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [copy.statusText, nextUrl, flow]);

  const progressStyle = useMemo(
    () => ({
      width: `${progress}%`,
    }),
    [progress],
  );

  return (
    <main className="min-h-screen bg-[#111113] px-4 py-6 flex items-center justify-center">
      <section className="tc-enter w-full max-w-[440px] rounded-[30px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.05)_42%,rgba(0,0,0,0.22))] p-[3px] shadow-[0_34px_90px_-42px_rgba(0,0,0,0.9)]">
        <div className="relative overflow-hidden rounded-[27px] border border-white/30 bg-[linear-gradient(180deg,#e2dddf_0%,#d7d2d4_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          <div className="mb-5 h-[3px] rounded-full bg-[linear-gradient(90deg,#621638,#A52E64,#c45b8b)] shadow-[0_8px_22px_rgba(165,46,100,0.32)]" />

          <div className="grid grid-cols-[52px_1fr] items-center gap-3">
            <div className="tc-sheen grid h-[52px] w-[52px] place-items-center rounded-[17px] border border-white/10 bg-[linear-gradient(145deg,#2d282b,#1f1c1f)] shadow-[0_18px_34px_-24px_rgba(0,0,0,0.72)]">
              <span className="text-[15px] font-black tracking-[-0.08em] text-[#f3f0f1]">
                RV
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A52E64]">
                {copy.eyebrow}
              </p>

              <h1 className="mt-1 text-[20px] font-black leading-[1.05] tracking-[-0.045em] text-[#1f191c]">
                {copy.title}
              </h1>

              <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#5e5559]">
                {copy.description}
              </p>
            </div>
          </div>

          <div className="tc-sheen mt-5 grid grid-cols-[44px_1fr] items-center gap-3 rounded-[18px] border border-[#bbb3b7] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-3 shadow-[0_18px_42px_-32px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.48)]">
            <div className="grid h-11 w-11 place-items-center rounded-[15px] border border-[#c4bcc0] bg-[#d7d1d4] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              <div className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-[#A52E64]/20 border-t-[#A52E64]" />
            </div>

            <div className="min-w-0">
              <p className="text-[14px] font-black tracking-[-0.025em] text-[#1f191c]">
                {copy.statusTitle}
              </p>
              <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#5e5559]">
                {label}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-full bg-[#c5bec1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]">
            <div
              className="h-[7px] rounded-full bg-[linear-gradient(90deg,#621638,#A52E64,#c45b8b)] shadow-[0_0_18px_rgba(165,46,100,0.34)] transition-[width] duration-150 ease-out"
              style={progressStyle}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] border border-black/5 bg-[#e2dddf]/60 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#81777b]">
              Destino
            </p>
            <p className="max-w-[180px] truncate text-right text-[12px] font-black text-[#1f191c]">
              {copy.destination}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LaunchPage() {
  return (
    <Suspense fallback={null}>
      <LaunchContent />
    </Suspense>
  );
}