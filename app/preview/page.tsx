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
  image?: string;
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
};

const fallbackRevista: RevistaMeta = {
  number: 128,
  title: "Catálogo Primavera 2025",
  client: "Todo Costura S.A.",
  maxSheets: 18,
  maxColumns: 4,
  maxArticles: 48,
};

export default function PreviewPage() {
  const router = useRouter();

  const [revista, setRevista] = useState<RevistaMeta>(fallbackRevista);
  const [labels, setLabels] = useState<ProductLabel[]>([]);
  const [products, setProducts] = useState<AddedProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [showCreatedToast, setShowCreatedToast] = useState(false);
  const saveLockRef = useRef(false);

  useEffect(() => {
    try {
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
          setProducts(
            parsedProducts
              .filter(
                (item) =>
                  item && Number(item.sheet) > 0 && Number(item.column) > 0,
              )
              .sort((a, b) => {
                if (Number(a.sheet) !== Number(b.sheet))
                  return Number(a.sheet) - Number(b.sheet);
                if (Number(a.column) !== Number(b.column)) {
                  return Number(a.column) - Number(b.column);
                }
                if (Number(a.row) !== Number(b.row))
                  return Number(a.row) - Number(b.row);
                return String(a.name || a.code).localeCompare(
                  String(b.name || b.code),
                );
              }),
          );
        }
      }
    } catch {
      setLabels([]);
      setProducts([]);
    }
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
        items: items.sort((a, b) => {
          if (a.column !== b.column) return a.column - b.column;
          if (a.row !== b.row) return a.row - b.row;
          return a.name.localeCompare(b.name);
        }),
      }));
  }, [products]);

  useEffect(() => {
    if (activeIndex > sheets.length - 1) setActiveIndex(0);
  }, [activeIndex, sheets.length]);

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


  useEffect(() => {
    if (!showCreatedToast) return;

    const timeout = window.setTimeout(() => {
      setShowCreatedToast(false);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [showCreatedToast]);

  function savePreview() {
    if (products.length === 0 || isSavingPreview || saved || saveLockRef.current) return;

    saveLockRef.current = true;
    setIsSavingPreview(true);

    window.setTimeout(() => {
      const snapshot = {
        revista,
        labels,
        products,
        savedAt: new Date().toISOString(),
      };

      sessionStorage.setItem("revista_saved_preview", JSON.stringify(snapshot));
      setSaved(true);
      setIsSavingPreview(false);
      setShowCreatedToast(true);
    }, 950);
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden bg-[#101011] px-3 py-4 text-[#221d20] sm:px-5 lg:px-7">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-18%,rgba(255,255,255,.08),transparent_32%),linear-gradient(180deg,#151416_0%,#101011_72%)]" />

        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[1180px] rounded-[30px] border border-white/35 bg-[linear-gradient(145deg,#e4dfe1,#d5d0d2_62%,#cbc5c8)] p-3 shadow-[0_34px_90px_rgba(0,0,0,.42),inset_0_1px_0_rgba(255,255,255,.75)] sm:p-5"
        >
          <AppHeader progress={progress} />

          <PreviewRail onProductsClick={() => router.push("/products")} />

          <section className="mt-4 rounded-[25px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#e9e4e6,#ded9db)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.52)] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A52E64]">
                  Vista previa
                </p>
                <h1 className="mt-1 text-[32px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22] sm:text-[44px]">
                  Revisión final
                </h1>
                <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#655c61]">
                  Verificá la composición por hoja antes de guardar la revista.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
                <InfoChip label="Revista" value={`#${revista.number}`} strong />
                <InfoChip label="Hojas" value={String(sheets.length)} />
              </div>
            </div>
          </section>

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
                  onClick={() => router.push("/products")}
                  className="tc-primary-button mt-5 w-full"
                >
                  Ir a productos
                </button>
              </div>
            )}
          </section>
        </motion.section>

        <CreatedToast show={showCreatedToast} />

        <RouteTransitionOverlay
          show={isSavingPreview}
          title="Guardando revista"
          description="Registrando la composición final..."
        />
      </main>
    </MotionConfig>
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
          className="fixed inset-x-3 bottom-5 z-[70] mx-auto flex max-w-[360px] items-center gap-3 rounded-[22px] border border-white/25 bg-[#232124] px-4 py-3 text-[#f4f1f3] shadow-[0_22px_60px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.10)] sm:bottom-7"
          role="status"
          aria-live="polite"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#A52E64] text-white shadow-[0_12px_28px_rgba(165,46,100,.32)]">
            <Check className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-black tracking-[-0.035em]">
              Revista creada
            </span>
            <span className="mt-0.5 block text-[11px] font-bold text-[#f4f1f3]/58">
              La revista se guardó correctamente.
            </span>
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function AppHeader({ progress }: { progress: number }) {
  return (
    <header className="tc-sheen relative overflow-hidden rounded-[26px] bg-[#232124] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:p-5">
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
    <nav className="mt-4 grid gap-2 rounded-[21px] border border-[#bdb5b9] bg-[#d8d3d5] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.55)] md:grid-cols-2">
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
          className={`text-[10px] font-black ${active ? "text-white/50" : "text-[#7b7277]"}`}
        >
          {subtitle}
        </div>
      </div>

      <span
        className={`text-[11px] font-black ${active ? "text-white/50" : "text-[#8a8085]"}`}
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
    <section className="mb-3 rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-3 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)] sm:p-4">
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
    <div className="mt-3 grid gap-2 rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-3 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)] sm:grid-cols-2 sm:p-4">
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
  return (
    <motion.section
      key={sheetNumber}
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[28px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#f0ecee,#e2dddf)] shadow-[0_22px_60px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.62)]"
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
            hoja.
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

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductPreviewCard
              key={`${product.id}-${product.sheet}-${product.column}-${product.row}`}
              product={product}
              label={getLabel(product.labelId)}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function ProductPreviewCard({
  product,
  label,
}: {
  product: AddedProduct;
  label?: ProductLabel;
}) {
  const lines = (product.customDescription || product.description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <article className="overflow-hidden rounded-[20px] border border-[#bdb5b9] bg-[#ebe7e8] shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(0,0,0,.15),inset_0_1px_0_rgba(255,255,255,.58)]">
      <div
        className="flex min-h-10 items-center justify-between gap-3 px-4 py-2 text-white"
        style={{ backgroundColor: label?.color ?? "#A52E64" }}
      >
        <span className="truncate text-[11px] font-black uppercase">
          {product.category}
        </span>
        <span className="text-[10px] font-black opacity-80">
          C{product.column} · F{product.row}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-4 grid h-28 place-items-center rounded-[16px] border border-[#c4bcc0] bg-[#f2eef0]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-[#A52E64]/10 text-[13px] font-black text-[#A52E64] ring-1 ring-[#A52E64]/10">
              {product.factoryCode?.slice(0, 4) ||
                product.code?.slice(0, 4) ||
                "TC"}
            </div>
          )}
        </div>

        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#A52E64]">
          {product.brand || "Todo Costura"}
        </p>

        <p className="mt-1 text-[10.5px] font-bold text-[#81777b]">
          Art: {product.code} · Fab: {product.factoryCode}
        </p>

        <h3 className="mt-2 text-[16px] font-black leading-tight tracking-[-0.045em] text-[#241f22]">
          {product.name}
        </h3>

        <div className="mt-3 grid gap-1.5">
          {lines.length > 0 ? (
            lines.slice(0, 5).map((line) => (
              <p
                key={line}
                className="text-[11.5px] font-semibold leading-relaxed text-[#655c61]"
              >
                • {line}
              </p>
            ))
          ) : (
            <p className="text-[11.5px] font-semibold italic leading-relaxed text-[#81777b]">
              Sin descripción.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#A52E64]/10 px-3 py-1 text-[10px] font-black text-[#A52E64]">
            Hoja {product.sheet}
          </span>
          <span className="rounded-full bg-[#e2dddf] px-3 py-1 text-[10px] font-black text-[#756b70]">
            Columna {product.column}
          </span>
          <span className="rounded-full bg-[#e2dddf] px-3 py-1 text-[10px] font-black text-[#756b70]">
            Fila {product.row}
          </span>
        </div>
      </div>
    </article>
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
