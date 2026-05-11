"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageSearch,
  Printer,
  Save,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RouteTransitionOverlay } from "@/app/_components/route-transition-overlay";
import { get_flow_from_url } from "@/src/lib/api/flow";
import { validate_revista_session } from "@/src/lib/api/session";

type ProductLabel = {
  id: string;
  title: string;
  color: string;
};

type AddedProduct = {
  id: string;
  name: string;
  code: string;
  factoryCode: string;
  brand: string;
  category: string;
  price: string;
  priceNumber?: number;
  priceBookName?: string;
  image?: string;
  coverUrl?: string;
  description: string;
  sheet: number;
  column: number;
  row: number;
  labelId: string;
  customDescription: string;
};

type RevistaMeta = {
  number: number;
  title: string;
  client: string;
  maxSheets: number;
  maxColumns: number;
  maxArticles: number;
  tipoClientePrecio?: string;
  recordId?: string;
};

const fallbackRevista: RevistaMeta = {
  number: 0,
  title: "Revista sin seleccionar",
  client: "Cliente no asignado",
  maxSheets: 1,
  maxColumns: 1,
  maxArticles: 1,
};
function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_REVISTA_API_BASE_URL ??
    "https://tc-gestor-revista-api.todocostura.workers.dev"
  ).replace(/\/$/, "");
}

function sortPreviewProducts(items: AddedProduct[]) {
  return items
    .filter((item) => item && Number(item.sheet) > 0 && Number(item.column) > 0)
    .sort((a, b) => {
      if (Number(a.sheet) !== Number(b.sheet)) {
        return Number(a.sheet) - Number(b.sheet);
      }

      if (Number(a.row) !== Number(b.row)) {
        return Number(a.row) - Number(b.row);
      }

      if (Number(a.column) !== Number(b.column)) {
        return Number(a.column) - Number(b.column);
      }

      return String(a.name || a.code).localeCompare(String(b.name || b.code));
    });
}

function toText(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildRevistaFromSavedSnapshot(
  snapshot: Record<string, unknown>,
): RevistaMeta {
  const fields =
    snapshot.snapshot_fields && typeof snapshot.snapshot_fields === "object"
      ? (snapshot.snapshot_fields as Record<string, unknown>)
      : {};

  const metadata =
    snapshot.metadata && typeof snapshot.metadata === "object"
      ? (snapshot.metadata as Record<string, unknown>)
      : {};

  return {
    ...fallbackRevista,
    recordId: toText(snapshot.record_id),
    number: toNumber(fields.nro ?? metadata.nro, 0),
    title:
      toText(fields.nombre_revista ?? metadata.nombre_revista) ||
      fallbackRevista.title,
    client:
      toText(fields.cliente_nombre ?? metadata.cliente_nombre) ||
      fallbackRevista.client,
    maxSheets: toNumber(fields.max_hojas ?? metadata.max_hojas, 1),
    maxColumns: toNumber(fields.max_columnas ?? metadata.max_columnas, 1),
    maxArticles: toNumber(fields.max_articulos ?? metadata.max_articulos, 1),
    tipoClientePrecio: toText(
      fields.tipo_cliente_precio ?? metadata.tipo_cliente_precio,
    ),
  };
}
export default function PreviewPage() {
  const router = useRouter();

  const [flow, setFlow] = useState("");
  const [revista, setRevista] = useState<RevistaMeta>(fallbackRevista);
  const [labels, setLabels] = useState<ProductLabel[]>([]);
  const [products, setProducts] = useState<AddedProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savedUrl, setSavedUrl] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [showCreatedToast, setShowCreatedToast] = useState(false);
  const [accessStatus, setAccessStatus] = useState<
    "checking" | "authorized" | "unauthorized"
  >("checking");

  const saveLockRef = useRef(false);
  const routeLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        const url = new URL(window.location.href);
        const savedToken = url.searchParams.get("tk") || "";

        if (savedToken) {
          const response = await fetch(
            `${getApiBaseUrl()}/api/revista/preview/saved?tk=${encodeURIComponent(
              savedToken,
            )}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            },
          );

          const payload = await response.json();

          if (!response.ok || payload?.ok === false) {
            throw new Error(
              payload?.error?.message ||
                payload?.message ||
                payload?.error ||
                "No se pudo cargar la revista guardada.",
            );
          }

          const snapshot = (payload?.data ?? payload) as Record<
            string,
            unknown
          >;

          if (cancelled) return;

          const savedLabels = Array.isArray(snapshot.labels)
            ? (snapshot.labels as ProductLabel[])
            : [];

          const savedProducts = Array.isArray(snapshot.productos)
            ? sortPreviewProducts(snapshot.productos as AddedProduct[])
            : [];

          const savedRevista = buildRevistaFromSavedSnapshot(snapshot);

          setFlow("");
          setAccessStatus("authorized");
          setRevista(savedRevista);
          setLabels(savedLabels);
          setProducts(savedProducts);
          setSaved(false);
          setSavedUrl("");

          cleanSensitiveUrlParams(["tk"]);

          sessionStorage.setItem(
            "revista_preview_meta",
            JSON.stringify(savedRevista),
          );
          sessionStorage.setItem("revista_labels", JSON.stringify(savedLabels));
          sessionStorage.setItem(
            "revista_productos",
            JSON.stringify(savedProducts),
          );

          return;
        }

        const currentFlow =
          get_flow_from_url() || sessionStorage.getItem("revista_flow") || "";

        if (!currentFlow) {
          throw new Error("La sesión de acceso no está activa.");
        }

        await validate_revista_session(currentFlow);

        if (cancelled) return;

        setFlow(currentFlow);
        setAccessStatus("authorized");
        sessionStorage.setItem("revista_flow", currentFlow);
        cleanSensitiveUrlParams(["flow", "v"]);

        const rawMeta = sessionStorage.getItem("revista_preview_meta");
        const rawLabels = sessionStorage.getItem("revista_labels");
        const rawProducts = sessionStorage.getItem("revista_productos");

        if (rawMeta) {
          setRevista({ ...fallbackRevista, ...JSON.parse(rawMeta) });
        }

        if (rawLabels) {
          const parsedLabels = JSON.parse(rawLabels);
          if (Array.isArray(parsedLabels)) setLabels(parsedLabels);
        }

        if (rawProducts) {
          const parsedProducts = JSON.parse(rawProducts);
          if (Array.isArray(parsedProducts)) {
            setProducts(sortPreviewProducts(parsedProducts as AddedProduct[]));
          }
        }
      } catch {
        if (cancelled) return;

        setAccessStatus("unauthorized");
        setFlow("");
        sessionStorage.removeItem("revista_flow");
        setLabels([]);
        setProducts([]);
        cleanSensitiveUrlParams(["flow", "tk", "v"]);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, []);

  const sheets = useMemo(() => {
    const map = new Map<number, AddedProduct[]>();

    for (const product of products) {
      const sheetProducts = map.get(product.sheet) ?? [];
      sheetProducts.push(product);
      map.set(product.sheet, sheetProducts);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([sheet, items]) => ({
        sheet,
        items: [...items].sort((a, b) => {
          if (a.row !== b.row) return a.row - b.row;
          if (a.column !== b.column) return a.column - b.column;
          return a.name.localeCompare(b.name);
        }),
      }));
  }, [products]);

  useEffect(() => {
    if (activeIndex > sheets.length - 1) setActiveIndex(0);
  }, [activeIndex, sheets.length]);

  useEffect(() => {
    if (!showCreatedToast) return;

    const timeout = window.setTimeout(() => {
      setShowCreatedToast(false);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [showCreatedToast]);

  const activeSheet = sheets[activeIndex] ?? null;
  const progress = Math.round(
    (products.length / Math.max(revista.maxArticles, 1)) * 100,
  );

  function getLabel(labelId: string) {
    return labels.find((label) => label.id === labelId);
  }

  function goPrevSheet() {
    setActiveIndex((current) => Math.max(0, current - 1));
  }

  function goNextSheet() {
    setActiveIndex((current) => Math.min(sheets.length - 1, current + 1));
  }

  function goToProducts() {
    if (accessStatus !== "authorized" || !flow) return;
    if (isRouteLoading || routeLockRef.current) return;

    routeLockRef.current = true;
    setIsRouteLoading(true);

    const target = flow
      ? `/products?flow=${encodeURIComponent(flow)}`
      : "/products";

    window.setTimeout(() => {
      router.push(target);

      window.setTimeout(() => {
        if (window.location.pathname !== "/products") {
          window.location.assign(target);
        }
      }, 700);
    }, 850);
  }

  async function savePreview() {
    if (accessStatus !== "authorized" || !flow) return;

    if (
      products.length === 0 ||
      isSavingPreview ||
      saved ||
      saveLockRef.current
    ) {
      return;
    }

    saveLockRef.current = true;
    setIsSavingPreview(true);
    setSaveError("");

    try {
      const snapshot = {
        revista,
        labels,
        products,
        total_productos: products.length,
        total_hojas: sheets.length,
        savedAt: new Date().toISOString(),
        storage: "cloudflare_kv",
      };

      const apiBaseUrl = (
        process.env.NEXT_PUBLIC_REVISTA_API_BASE_URL ??
        "https://tc-gestor-revista-api.todocostura.workers.dev"
      ).replace(/\/$/, "");

      const response = await fetch(
        `${apiBaseUrl}/api/revista/save-pdf?flow=${encodeURIComponent(flow)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            record_id: revista.recordId,
            productos: products,
            labels,
            metadata: {
              nro: revista.number,
              nombre_revista: revista.title,
              cliente_nombre: revista.client,
              max_hojas: revista.maxSheets,
              max_columnas: revista.maxColumns,
              max_articulos: revista.maxArticles,
              tipo_cliente_precio: revista.tipoClientePrecio,
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.error?.message ||
            data?.message ||
            data?.error ||
            "No se pudo guardar la revista.",
        );
      }

      const result = data?.data ?? data;
      const finalUrl = String(result?.final_url || "");

      if (!finalUrl) {
        throw new Error("El API no devolvió el link final de la revista.");
      }

      sessionStorage.setItem("revista_saved_preview", JSON.stringify(snapshot));
      sessionStorage.setItem("revista_saved_state", JSON.stringify(snapshot));
      sessionStorage.setItem(
        "revista_saved_token",
        String(result?.saved_token || ""),
      );
      sessionStorage.setItem("revista_saved_final_url", finalUrl);

      setSaved(true);
      setSavedUrl("");
      cleanSensitiveUrlParams(["flow", "tk"]);
      setShowCreatedToast(true);
    } catch (error) {
      saveLockRef.current = false;
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la revista.",
      );
    } finally {
      setIsSavingPreview(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="tc-preview-page min-h-screen overflow-x-hidden bg-[#101011] px-3 py-4 text-[#221d20] sm:px-5 lg:px-7">
        <div className="tc-screen-only pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-18%,rgba(255,255,255,.08),transparent_32%),linear-gradient(180deg,#151416_0%,#101011_72%)]" />

        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="tc-preview-shell relative mx-auto w-full max-w-[1180px] rounded-[30px] border border-white/35 bg-[linear-gradient(145deg,#e4dfe1,#d5d0d2_62%,#cbc5c8)] p-3 shadow-[0_34px_90px_rgba(0,0,0,.42),inset_0_1px_0_rgba(255,255,255,.75)] sm:p-5"
        >
          <AppHeader progress={progress} />

          {accessStatus === "checking" ? (
            <AccessStatusPanel
              eyebrow="Validando acceso"
              title="Verificando sesión"
              description="Esperá un momento mientras verificamos que la sesión siga activa."
            />
          ) : accessStatus === "unauthorized" ? (
            <AccessStatusPanel
              eyebrow="Acceso restringido"
              title="Acceso no autorizado"
              description="Esta pantalla solo puede abrirse desde Zoho Creator o mediante un link de preview válido."
              restricted
            />
          ) : (
            <>
              <PreviewRail onProductsClick={goToProducts} />

              <section className="tc-screen-only mt-4 rounded-[25px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#e9e4e6,#ded9db)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.52)] sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A52E64]">
                      Vista previa
                    </p>
                    <h1 className="mt-1 text-[32px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22] sm:text-[44px]">
                      Revisión final
                    </h1>
                    <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#655c61]">
                      Verificá la composición por hoja antes de guardar la
                      revista.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
                    <InfoChip
                      label="Revista"
                      value={`#${revista.number}`}
                      strong
                    />
                    <InfoChip label="Hojas" value={String(sheets.length)} />
                  </div>
                </div>
              </section>

              {saveError ? (
                <section className="tc-screen-only mt-4 rounded-[18px] border border-[#A52E64]/25 bg-[#A52E64]/10 px-4 py-3 text-[12px] font-black leading-relaxed text-[#A52E64]">
                  {saveError}
                </section>
              ) : null}

              <section className="mt-4 grid gap-4">
                {activeSheet ? (
                  <section className="min-w-0">
                    <SheetControlBar
                      activeSheet={activeSheet.sheet}
                      activeIndex={activeIndex}
                      sheets={sheets}
                      onPrev={goPrevSheet}
                      onNext={goNextSheet}
                      onSelect={setActiveIndex}
                    />

                    <MagazineSheet
                      sheetNumber={activeSheet.sheet}
                      products={activeSheet.items}
                      getLabel={getLabel}
                      revista={revista}
                    />

                    <FinalActions
                      saved={saved}
                      disabled={products.length === 0 || isSavingPreview}
                      saving={isSavingPreview}
                      onSave={savePreview}
                      onPrint={() => window.print()}
                    />
                  </section>
                ) : (
                  <div className="rounded-[26px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-6 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)]">
                    <EmptyState
                      title="Preview vacío"
                      description="La vista previa aparecerá cuando agregues productos desde la pantalla anterior."
                    />

                    <button
                      type="button"
                      onClick={goToProducts}
                      className="tc-primary-button mt-5 w-full"
                    >
                      Ir a productos
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </motion.section>

        <CreatedToast show={showCreatedToast} />
        <PrintStyles />

        <RouteTransitionOverlay
          show={isSavingPreview || isRouteLoading}
          title={isRouteLoading ? "Cargando productos" : "Guardando revista"}
          description={
            isRouteLoading
              ? "Preparando la sección de artículos..."
              : "Registrando la composición final..."
          }
        />
      </main>
    </MotionConfig>
  );
}

function PrintStyles() {
  return (
    <style jsx global>{`
      .tc-print-description {
        display: none;
      }

      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }

        html,
        body {
          background: #ffffff !important;
          color: #221d20 !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .tc-screen-only {
          display: none !important;
        }

        .tc-preview-page {
          min-height: auto !important;
          background: #ffffff !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        .tc-preview-shell {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          box-shadow: none !important;
        }

        .tc-preview-shell > section.mt-4.grid {
          margin-top: 0 !important;
          display: block !important;
        }

        .tc-print-sheet {
          overflow: visible !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          box-shadow: none !important;
          break-after: auto;
        }

        .tc-print-sheet > header {
          padding: 0 0 8mm 0 !important;
          border-bottom: 1px solid #c8c0c4 !important;
          background: #ffffff !important;
          color: #221d20 !important;
        }

        .tc-print-sheet > header h2 {
          font-size: 22px !important;
          color: #221d20 !important;
        }

        .tc-print-sheet > header p {
          color: #6b6267 !important;
        }

        .tc-print-sheet > header > div:last-child {
          border-color: #c8c0c4 !important;
          background: #ffffff !important;
          color: #221d20 !important;
        }

        .tc-print-sheet > div.grid {
          display: block !important;
          padding: 6mm 0 0 0 !important;
        }

        .tc-print-group {
          margin-bottom: 7mm !important;
          overflow: visible !important;
          border: 1px solid #c8c0c4 !important;
          border-radius: 10px !important;
          background: #ffffff !important;
          box-shadow: none !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .tc-print-group > div:first-child {
          min-height: 28px !important;
          padding: 6px 10px !important;
        }

        .tc-print-group > div.grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 6mm !important;
          padding: 6mm !important;
        }

        .tc-print-group > div.grid:has(.tc-print-product:only-child) {
          grid-template-columns: minmax(0, 1fr) !important;
        }

        .tc-print-product {
          display: block !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: none !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .tc-print-product h3 {
          display: block !important;
          -webkit-line-clamp: unset !important;
          overflow: visible !important;
          font-size: 12px !important;
          line-height: 1.25 !important;
        }

        .tc-description-control,
        .tc-print-product .absolute {
          display: none !important;
        }

        .tc-print-description {
          display: block !important;
          margin-top: 10px !important;
          border-top: 1px solid #d4cdd0 !important;
          padding-top: 8px !important;
        }

        .tc-print-description-title {
          margin-bottom: 4px !important;
          font-size: 9px !important;
          font-weight: 900 !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
          color: #a52e64 !important;
        }

        .tc-print-description-body {
          font-size: 10px !important;
          font-weight: 700 !important;
          line-height: 1.35 !important;
          color: #5f565b !important;
        }

        .tc-print-description-body p {
          margin: 0 0 2px 0 !important;
        }
      }
    `}</style>
  );
}

function AccessStatusPanel({
  eyebrow,
  title,
  description,
  restricted,
}: {
  eyebrow: string;
  title: string;
  description: string;
  restricted?: boolean;
}) {
  return (
    <section
      className={`mt-4 rounded-[22px] border p-5 text-center shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.40)] ${
        restricted
          ? "border-[#A52E64]/25 bg-[#A52E64]/10"
          : "border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)]"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A52E64]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-[28px] font-black tracking-[-0.06em] text-[#241f22]">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-[13px] font-bold leading-relaxed text-[#655c61]">
        {description}
      </p>
    </section>
  );
}

function CreatedToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="tc-screen-only fixed inset-x-3 bottom-5 z-[70] mx-auto flex max-w-[360px] items-center gap-3 rounded-[22px] border border-white/25 bg-[#232124] px-4 py-3 text-[#f4f1f3] shadow-[0_22px_60px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.10)] sm:bottom-7"
          role="status"
          aria-live="polite"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#A52E64] text-white shadow-[0_12px_28px_rgba(165,46,100,.32)]">
            <Check className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-black tracking-[-0.035em]">
              Revista guardada
            </span>
            <span className="mt-0.5 block text-[11px] font-bold text-[#f4f1f3]/58">
              La revista se registró correctamente.
            </span>
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function AppHeader({ progress }: { progress: number }) {
  return (
    <header className="tc-screen-only tc-sheen relative overflow-hidden rounded-[26px] bg-[#232124] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:p-5">
      <div className="relative z-10 grid gap-4 sm:grid-cols-[104px_1fr_auto] sm:items-center">
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
          <h2 className="mt-1 text-[38px] font-black leading-[0.9] tracking-[-0.075em] text-[#f4f1f3] sm:text-[56px] lg:text-[66px]">
            Preview
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#f4f1f3]/68 sm:text-[15px]">
            Validación final de la revista antes de guardar.
          </p>
        </div>

        <div className="rounded-[18px] border border-white/10 bg-white/[0.055] px-4 py-3">
          <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/44">
            Avance
          </span>
          <span className="mt-1 block text-[26px] font-black tracking-[-0.06em] text-[#f4f1f3]">
            {progress}%
          </span>
        </div>
      </div>
    </header>
  );
}

function PreviewRail({ onProductsClick }: { onProductsClick: () => void }) {
  return (
    <nav className="tc-screen-only mt-4 grid gap-2 rounded-[21px] border border-[#bdb5b9] bg-[#d8d3d5] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.55)] md:grid-cols-2">
      <RailItem
        done
        asButton
        icon={<PackageSearch />}
        title="Productos"
        subtitle="Completado"
        number="02"
        onClick={onProductsClick}
      />
      <RailItem
        active
        icon={<Eye />}
        title="Preview"
        subtitle="Actual"
        number="03"
      />
    </nav>
  );
}

function RailItem({
  active,
  done,
  asButton,
  icon,
  title,
  subtitle,
  number,
  onClick,
}: {
  active?: boolean;
  done?: boolean;
  asButton?: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  number: string;
  onClick?: () => void;
}) {
  const className = `group flex items-center gap-3 rounded-[17px] px-3 py-3 text-left transition ${
    active
      ? "bg-[#242225] text-[#f4f1f3] shadow-[0_14px_30px_rgba(0,0,0,.22)]"
      : "text-[#332d31] hover:bg-[#ebe7e8] hover:shadow-[0_12px_26px_rgba(0,0,0,.10)] active:scale-[0.99]"
  }`;

  const content = (
    <>
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border transition ${
          active
            ? "border-[#A52E64]/35 bg-[#A52E64]"
            : done
              ? "border-[#A52E64]/25 bg-[#A52E64]/10 text-[#A52E64] group-hover:bg-[#A52E64]/15"
              : "border-[#bdb5b9] bg-[#e7e2e4] text-[#A52E64]"
        } [&_svg]:h-4 [&_svg]:w-4`}
      >
        {done ? <Check className="h-4 w-4" /> : icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-black tracking-[-0.04em]">
          {title}
        </div>
        <div
          className={`text-[10px] font-black ${
            active ? "text-white/50" : "text-[#7b7277]"
          }`}
        >
          {subtitle}
        </div>
      </div>

      <span
        className={`text-[11px] font-black ${
          active ? "text-white/50" : "text-[#8a8085]"
        }`}
      >
        {number}
      </span>
    </>
  );

  if (asButton) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function SheetControlBar({
  activeSheet,
  activeIndex,
  sheets,
  onPrev,
  onNext,
  onSelect,
}: {
  activeSheet: number;
  activeIndex: number;
  sheets: { sheet: number; items: AddedProduct[] }[];
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <section className="tc-screen-only mb-3 rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-3 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)] sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#81777b]">
              Navegación de hoja
            </p>
            <h3 className="mt-1 text-[20px] font-black leading-none tracking-[-0.055em] text-[#241f22]">
              Hoja {activeSheet}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onPrev}
            disabled={activeIndex === 0}
            className="grid h-11 w-11 place-items-center rounded-[15px] border border-[#b9b0b5] bg-[#ebe7e8] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#A52E64]/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Hoja anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-wrap justify-center gap-1.5 px-1">
            {sheets.map((sheet, index) => (
              <button
                key={sheet.sheet}
                type="button"
                onClick={() => onSelect(index)}
                className={`h-2.5 rounded-full transition ${
                  index === activeIndex
                    ? "w-8 bg-[#A52E64]"
                    : "w-2.5 bg-[#bdb5b9] hover:bg-[#A52E64]/45"
                }`}
                aria-label={`Ir a hoja ${sheet.sheet}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={activeIndex >= sheets.length - 1}
            className="grid h-11 w-11 place-items-center rounded-[15px] border border-[#b9b0b5] bg-[#ebe7e8] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#A52E64]/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Hoja siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function FinalActions({
  saved,
  disabled,
  saving,
  onSave,
  onPrint,
}: {
  saved: boolean;
  disabled: boolean;
  saving: boolean;
  onSave: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="tc-screen-only mt-3 grid gap-2 rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-3 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)] sm:grid-cols-2 sm:p-4">
      <button
        type="button"
        onClick={onSave}
        disabled={disabled || saved}
        className="tc-primary-button flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving
          ? "Guardando revista"
          : saved
            ? "Revista guardada"
            : "Guardar revista"}
        {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={onPrint}
        disabled={disabled}
        className="min-h-11 rounded-[16px] border border-[#b9b0b5] bg-[#ebe7e8] px-4 text-[13px] font-black text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#A52E64]/10 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="inline-flex items-center justify-center gap-2">
          Imprimir
          <Printer className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}

function InfoChip({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-[#bdb5b9] bg-[#e5e0e2] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
      <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[#81777c]">
        {label}
      </span>
      <span
        className={`mt-1 block truncate text-[15px] font-black leading-none tracking-[-0.04em] ${
          strong ? "text-[#A52E64]" : "text-[#241f22]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

type ProductPreviewGroup = {
  key: string;
  labelId: string;
  products: AddedProduct[];
};

function MagazineSheet({
  sheetNumber,
  products,
  getLabel,
  revista,
}: {
  sheetNumber: number;
  products: AddedProduct[];
  getLabel: (labelId: string) => ProductLabel | undefined;
  revista: RevistaMeta;
}) {
  const groups = buildProductGroups(products);

  return (
    <motion.section
      key={sheetNumber}
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="tc-print-sheet overflow-hidden rounded-[28px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#f0ecee,#e2dddf)] shadow-[0_22px_60px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.62)]"
    >
      <header className="flex flex-col gap-4 border-b border-[#bdb5b9] bg-[#232124] p-4 text-[#f4f1f3] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9b9c9]">
            Hoja {sheetNumber}
          </p>
          <h2 className="mt-1 text-[28px] font-black leading-none tracking-[-0.065em] sm:text-[36px]">
            {revista.title}
          </h2>
          <p className="mt-2 text-[12px] font-bold text-[#f4f1f3]/60">
            {products.length} artículo{products.length === 1 ? "" : "s"} en esta
            hoja · {groups.length} grupo{groups.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="grid h-16 w-16 place-items-center rounded-[18px] border border-white/15 bg-white/[0.06] text-center">
          <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/50">
            Hoja
          </span>
          <span className="text-[24px] font-black leading-none">
            {sheetNumber}
          </span>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:p-5">
        {groups.map((group) => (
          <ProductPreviewLabelGroup
            key={group.key}
            group={group}
            label={getLabel(group.labelId)}
          />
        ))}
      </div>
    </motion.section>
  );
}

function buildProductGroups(products: AddedProduct[]): ProductPreviewGroup[] {
  const map = new Map<string, ProductPreviewGroup>();

  for (const product of products) {
    const labelId = product.labelId || `sin-etiqueta-${product.sheet}`;
    const key = `${product.sheet}-${labelId}`;

    const current =
      map.get(key) ??
      ({
        key,
        labelId: product.labelId || "",
        products: [],
      } satisfies ProductPreviewGroup);

    current.products.push(product);
    map.set(key, current);
  }

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      products: [...group.products].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        if (a.column !== b.column) return a.column - b.column;
        return a.name.localeCompare(b.name);
      }),
    }))
    .sort((a, b) => {
      const aFirst = a.products[0];
      const bFirst = b.products[0];

      if ((aFirst?.row ?? 0) !== (bFirst?.row ?? 0)) {
        return (aFirst?.row ?? 0) - (bFirst?.row ?? 0);
      }

      if ((aFirst?.column ?? 0) !== (bFirst?.column ?? 0)) {
        return (aFirst?.column ?? 0) - (bFirst?.column ?? 0);
      }

      return a.key.localeCompare(b.key);
    });
}

function getLabelGridClass(productCount: number) {
  if (productCount <= 1) return "grid-cols-1";
  if (productCount === 2) return "grid-cols-1 md:grid-cols-2";
  if (productCount === 3) return "grid-cols-1 md:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
}

function ProductPreviewLabelGroup({
  group,
  label,
}: {
  group: ProductPreviewGroup;
  label?: ProductLabel;
}) {
  const firstProduct = group.products[0];
  const groupTitle =
    label?.title || firstProduct?.category || "Grupo sin etiqueta";
  const gridClass = getLabelGridClass(group.products.length);

  return (
    <section className="tc-print-group overflow-hidden rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)]">
      <div
        className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 text-white"
        style={{ backgroundColor: label?.color ?? "#A52E64" }}
      >
        <span className="truncate text-[12px] font-black uppercase tracking-[-0.02em]">
          {groupTitle}
        </span>

        <span className="shrink-0 text-[10px] font-black opacity-85">
          {group.products.length} art.
        </span>
      </div>

      <div className={`grid items-start gap-3 p-4 ${gridClass}`}>
        {group.products.map((product) => (
          <ProductPreviewItem
            key={`${product.id}-${product.sheet}-${product.column}-${product.row}`}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}

function ProductPreviewItem({ product }: { product: AddedProduct }) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const description = (
    product.customDescription ||
    product.description ||
    ""
  ).trim();
  const hasDescription = description.length > 0;
  const descriptionLines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <article className="tc-print-product relative grid h-[430px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-[16px] border border-[#c4bcc0] bg-[#f3eff1] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
      <ProductPreviewImage product={product} />

      <div className="min-h-0 pt-3">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#A52E64]">
          {product.brand || "Sin marca"}
        </p>

        <p className="mt-1 truncate text-[10.5px] font-bold text-[#756b70]">
          Art: {product.code || "—"} · Fab: {product.factoryCode || "—"}
        </p>

        <h3 className="mt-3 line-clamp-3 text-[14px] font-black uppercase leading-tight tracking-[-0.04em] text-[#241f22]">
          {product.name}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#A52E64]/10 px-3 py-1 text-[9px] font-black text-[#A52E64]">
            Hoja {product.sheet}
          </span>

          <span className="rounded-full bg-[#ddd7da] px-3 py-1 text-[9px] font-black text-[#62595d]">
            Columna {product.column}
          </span>

          <span className="rounded-full bg-[#ddd7da] px-3 py-1 text-[9px] font-black text-[#62595d]">
            Fila {product.row}
          </span>
        </div>
      </div>

      <div className="tc-description-control mt-3 border-t border-[#d4cdd0] pt-3">
        {hasDescription ? (
          <button
            type="button"
            onClick={() => setDescriptionOpen((current) => !current)}
            className="flex min-h-10 w-full items-center justify-between gap-3 rounded-[13px] border border-[#c4bcc0] bg-[#ebe7e8] px-3 text-left text-[11px] font-black text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition hover:bg-[#A52E64]/10 active:scale-[0.99]"
            aria-expanded={descriptionOpen}
          >
            <span>
              {descriptionOpen ? "Ocultar descripción" : "Ver descripción"}
            </span>
            <ChevronRight
              className={`h-4 w-4 shrink-0 transition ${
                descriptionOpen ? "rotate-90" : ""
              }`}
            />
          </button>
        ) : (
          <div className="grid min-h-10 place-items-center rounded-[13px] border border-dashed border-[#c4bcc0] bg-[#ebe7e8] px-3 text-[11px] font-bold text-[#8a8085]">
            Sin descripción
          </div>
        )}
      </div>

      {hasDescription ? (
        <div className="tc-print-description">
          <div className="tc-print-description-title">Descripción</div>
          <div className="tc-print-description-body">
            {descriptionLines.map((line, index) => (
              <p key={`${product.id}-print-description-line-${index}`}>
                • {line}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {descriptionOpen && hasDescription ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-3 bottom-3 z-10 max-h-[190px] overflow-hidden rounded-[15px] border border-[#A52E64]/25 bg-[#f7f2f4] shadow-[0_18px_45px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.65)]"
          >
            <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[#e1d7dc] bg-[#A52E64]/10 px-3">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#A52E64]">
                Descripción
              </span>
              <button
                type="button"
                onClick={() => setDescriptionOpen(false)}
                className="rounded-full px-2 py-1 text-[10px] font-black text-[#A52E64] transition hover:bg-[#A52E64]/10"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-[146px] overflow-y-auto px-3 py-2 text-[11px] font-bold leading-relaxed text-[#655c61]">
              {descriptionLines.map((line, index) => (
                <p
                  key={`${product.id}-description-line-${index}`}
                  className="py-0.5"
                >
                  • {line}
                </p>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

function ProductPreviewImage({ product }: { product: AddedProduct }) {
  const imageCandidates = [
    product.image || "",
    product.coverUrl || "",
    product.id
      ? `https://tc-gestor-revista-api.todocostura.workers.dev/api/revista/products/photo?id=${encodeURIComponent(
          product.id,
        )}`
      : "",
  ].filter(Boolean);

  const [imageIndex, setImageIndex] = useState(0);
  const imageUrl = imageCandidates[imageIndex] || "";

  function handleImageError() {
    setImageIndex((current) => {
      const next = current + 1;
      return next < imageCandidates.length ? next : current;
    });
  }

  return (
    <div className="grid h-[150px] place-items-center overflow-visible rounded-[14px] border border-[#c4bcc0] bg-white p-2">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name}
          className="block h-auto max-h-[140px] w-auto max-w-full object-contain"
          onError={handleImageError}
        />
      ) : (
        <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-[#A52E64]/10 text-[13px] font-black text-[#A52E64] ring-1 ring-[#A52E64]/10">
          {product.factoryCode?.slice(0, 4) ||
            product.code?.slice(0, 4) ||
            "TC"}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#c4bcc0] bg-[#e9e4e6] px-4 py-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-[16px] bg-[#A52E64]/10 text-[#A52E64]">
        <BookOpen className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-[18px] font-black tracking-[-0.04em] text-[#241f22]">
        {title}
      </h3>
      <p className="mt-2 text-[12px] font-bold leading-relaxed text-[#756b70]">
        {description}
      </p>
    </div>
  );
}

function buildPdfFilename(revista: RevistaMeta) {
  const nro = revista.number ? `revista-${revista.number}` : "revista";
  const title = slugify(revista.title || "sin-titulo");

  return `${nro}-${title}.pdf`;
}

function buildRevistaPdfBase64({
  revista,
  labels,
  products,
}: {
  revista: RevistaMeta;
  labels: ProductLabel[];
  products: AddedProduct[];
}) {
  const lines: string[] = [
    "TODO COSTURA",
    `Revista #${revista.number || ""}`,
    revista.title,
    `Cliente: ${revista.client}`,
    `Articulos: ${products.length}`,
    "",
  ];

  const sortedProducts = [...products].sort((a, b) => {
    if (a.sheet !== b.sheet) return a.sheet - b.sheet;
    if (a.row !== b.row) return a.row - b.row;
    if (a.column !== b.column) return a.column - b.column;
    return a.name.localeCompare(b.name);
  });

  for (const product of sortedProducts) {
    const label = labels.find((item) => item.id === product.labelId);

    lines.push(
      `Hoja ${product.sheet} - Columna ${product.column} - Fila ${product.row}`,
      `${product.name}`,
      `Codigo: ${product.code}`,
      `Marca: ${product.brand || ""}`,
      `Etiqueta: ${label?.title || "Sin etiqueta"}`,
      `Precio: ${product.price || ""}`,
    );

    const description = product.customDescription || product.description;
    if (description) {
      lines.push(`Descripcion: ${description}`);
    }

    lines.push("");
  }

  return createSimplePdfBase64(lines);
}

function createSimplePdfBase64(lines: string[]) {
  const sanitizedLines = lines.flatMap((line) => {
    const clean = toPdfText(line);
    const chunks: string[] = [];

    for (let i = 0; i < clean.length; i += 82) {
      chunks.push(clean.slice(i, i + 82));
    }

    return chunks.length > 0 ? chunks : [""];
  });

  const contentLines = [
    "BT",
    "/F1 10 Tf",
    "50 792 Td",
    "14 TL",
    ...sanitizedLines
      .slice(0, 52)
      .map((line) => `(${escapePdfText(line)}) Tj T*`),
    "ET",
  ];

  const content = contentLines.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return btoa(pdf);
}

function toPdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
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
