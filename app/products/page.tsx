"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { RouteTransitionOverlay } from "@/app/_components/route-transition-overlay";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Layers3,
  PackageSearch,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  build_api_url,
  get_flow_from_url,
  search_products,
} from "@/src/lib/api/flow";

type ProductLabel = {
  id: string;
  title: string;
  color: string;
};

type ProductRecord = {
  id: string;
  name: string;
  code: string;
  factoryCode: string;
  brand: string;
  category: string;
  price: string;
  priceNumber: number;
  priceBookName: string;
  description: string;
  coverUrl: string;
};

type AddedProduct = ProductRecord & {
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

type ApiProductRecord = {
  id?: string;
  codigo?: string;
  nombre?: string;
  tipoMaquina?: string;
  portadaUrl?: string;
  codigoFabrica?: string;
  descripcion?: string;
  marca?: string;
  precioNumero?: number;
  precioFormateado?: string;
  priceBookName?: string;
};

const labelColors = [
  "#A52E64",
  "#7d1d49",
  "#8e44ad",
  "#2980b9",
  "#00897b",
  "#27ae60",
  "#d4a017",
  "#e67e22",
  "#c0392b",
  "#546e7a",
];

const emptyRevista: RevistaMeta = {
  number: 0,
  title: "Revista sin seleccionar",
  client: "Cliente no asignado",
  maxSheets: 1,
  maxColumns: 1,
  maxArticles: 1,
};

export default function ProductsPage() {
  const router = useRouter();

  const [flow, setFlow] = useState("");
  const [revista, setRevista] = useState<RevistaMeta>(emptyRevista);

  const [labels, setLabels] = useState<ProductLabel[]>([]);
  const [labelTitle, setLabelTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(labelColors[0]);
  const [activeLabelId, setActiveLabelId] = useState("");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [sheet, setSheet] = useState("");
  const [column, setColumn] = useState("");
  const [row, setRow] = useState("1");
  const [description, setDescription] = useState("");

  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [previewProduct, setPreviewProduct] = useState<AddedProduct | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const routeLockRef = useRef(false);
  const hasHydratedStorageRef = useRef(false);

  useEffect(() => {
    const currentFlow =
      get_flow_from_url() || sessionStorage.getItem("revista_flow") || "";

    setFlow(currentFlow);

    if (currentFlow) {
      sessionStorage.setItem("revista_flow", currentFlow);
    }

    cleanSensitiveUrlParams();

    const storedMeta = sessionStorage.getItem("revista_preview_meta");
    const storedLabels = sessionStorage.getItem("revista_labels");
    const storedProducts = sessionStorage.getItem("revista_productos");

    if (storedMeta) {
      try {
        const parsed = JSON.parse(storedMeta) as Partial<RevistaMeta>;

        setRevista({
          number: Number(parsed.number) || emptyRevista.number,
          title: parsed.title?.trim() || emptyRevista.title,
          client: parsed.client?.trim() || emptyRevista.client,
          maxSheets: clampLimit(parsed.maxSheets, 1, 50, emptyRevista.maxSheets),
          maxColumns: clampLimit(parsed.maxColumns, 1, 4, emptyRevista.maxColumns),
          maxArticles: clampLimit(parsed.maxArticles, 1, 150, emptyRevista.maxArticles),
          tipoClientePrecio: parsed.tipoClientePrecio?.trim() || "",
          recordId: parsed.recordId?.trim() || "",
        });
      } catch {
        setRevista(emptyRevista);
      }
    }

    try {
      const parsedLabels = storedLabels ? JSON.parse(storedLabels) : [];

      if (Array.isArray(parsedLabels)) {
        const normalizedLabels = parsedLabels.filter(isValidProductLabel) as ProductLabel[];
        setLabels(normalizedLabels);

        if (normalizedLabels[0]) {
          setActiveLabelId(normalizedLabels[0].id);
        }
      }
    } catch {
      setLabels([]);
      setActiveLabelId("");
    }

    try {
      const parsedProducts = storedProducts ? JSON.parse(storedProducts) : [];

      if (Array.isArray(parsedProducts)) {
        setAddedProducts(
          parsedProducts.filter(isValidAddedProduct) as AddedProduct[],
        );
      }
    } catch {
      setAddedProducts([]);
    }

    hasHydratedStorageRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedStorageRef.current) return;

    sessionStorage.setItem("revista_labels", JSON.stringify(labels));
  }, [labels]);

  useEffect(() => {
    if (!hasHydratedStorageRef.current) return;

    sessionStorage.setItem("revista_productos", JSON.stringify(addedProducts));
  }, [addedProducts]);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (selectedProduct) return;

    if (cleanQuery.length < 1) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError("");

        const response = await search_products<ApiProductRecord[]>(
          cleanQuery,
          flow,
          revista.tipoClientePrecio,
        );

        if (cancelled) return;

        const normalized = response.data
          .map(normalizeApiProduct)
          .filter((product): product is ProductRecord => product !== null)
          .filter((product) => {
            return !addedProducts.some((item) => item.id === product.id);
          });

        setSearchResults(normalized);
      } catch (error) {
        if (cancelled) return;

        setSearchResults([]);
        setSearchError(
          error instanceof Error
            ? error.message
            : "No se pudo buscar productos.",
        );
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    addedProducts,
    flow,
    query,
    revista.tipoClientePrecio,
    selectedProduct,
  ]);

  const progress = Math.min(
    100,
    Math.round((addedProducts.length / revista.maxArticles) * 100),
  );

  const groupedProducts = useMemo(() => {
    const groups = new Map<number, AddedProduct[]>();

    for (const product of addedProducts) {
      const current = groups.get(product.sheet) ?? [];
      groups.set(product.sheet, [...current, product]);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([sheetNumber, products]) => ({
        sheetNumber,
        products: products.sort((a, b) => {
          if (a.column !== b.column) return a.column - b.column;
          return a.row - b.row;
        }),
      }));
  }, [addedProducts]);

  const canPreviewSelected = useMemo(() => buildPendingProduct() !== null, [
    activeLabelId,
    addedProducts,
    column,
    description,
    revista,
    row,
    selectedProduct,
    sheet,
  ]);

  function createLabel() {
    const title = labelTitle.trim();

    if (!title) return;
    if (labels.some((label) => label.title.toLowerCase() === title.toLowerCase())) return;

    const nextLabel = {
      id: `lbl-${Date.now()}`,
      title,
      color: selectedColor,
    };

    setLabels((current) => [...current, nextLabel]);
    setActiveLabelId(nextLabel.id);
    applyLabelToGroup(sheet, column, nextLabel.id);
    setLabelTitle("");
  }

  function removeLabel(id: string) {
    const isUsed = addedProducts.some((product) => product.labelId === id);
    if (isUsed) return;

    setLabels((current) => current.filter((label) => label.id !== id));

    if (activeLabelId === id) {
      const next = labels.find((label) => label.id !== id);
      setActiveLabelId(next?.id ?? "");
    }
  }

  function selectProduct(product: ProductRecord) {
    setSelectedProduct(product);
    setQuery(product.name);
    setDescription(product.description);
    setSheet("");
    setColumn("");
    setRow("1");
    setSearchResults([]);

    if (!activeLabelId && labels[0]) {
      setActiveLabelId(labels[0].id);
    }
  }

  function clearSelection() {
    setSelectedProduct(null);
    setQuery("");
    setDescription("");
    setSheet("");
    setColumn("");
    setRow("1");
    setSearchResults([]);
    setSearchError("");
  }

  function buildPendingProduct() {
    if (!selectedProduct || !activeLabelId) return null;

    const parsedSheet = Number(sheet);
    const parsedColumn = Number(column);
    const parsedRow = Number(row || "1");

    if (!parsedSheet || !parsedColumn || !parsedRow) return null;
    if (parsedSheet < 1 || parsedSheet > revista.maxSheets) return null;
    if (parsedColumn < 1 || parsedColumn > revista.maxColumns) return null;
    if (parsedRow < 1 || parsedRow > revista.maxArticles) return null;
    if (addedProducts.length >= revista.maxArticles) return null;

    const positionTaken = addedProducts.some((product) => {
      return (
        product.sheet === parsedSheet &&
        product.column === parsedColumn &&
        product.row === parsedRow
      );
    });

    if (positionTaken) return null;

    const groupLabelId = getGroupLabelId(parsedSheet, parsedColumn);

    return {
      ...selectedProduct,
      sheet: parsedSheet,
      column: parsedColumn,
      row: parsedRow,
      labelId: groupLabelId || activeLabelId,
      customDescription: description.trim(),
    };
  }

  function openPreview() {
    const pending = buildPendingProduct();
    if (!pending) return;

    setPreviewProduct(pending);
  }

  function confirmAddProduct() {
    if (!previewProduct) return;

    setAddedProducts((current) => [...current, previewProduct]);
    setPreviewProduct(null);
    clearSelection();
  }

  function removeProduct(id: string) {
    setAddedProducts((current) => current.filter((product) => product.id !== id));
  }

  function getGroupLabelId(sheetValue: string | number, columnValue: string | number) {
    const parsedSheet = Number(sheetValue);
    const parsedColumn = Number(columnValue);

    if (!parsedSheet || !parsedColumn) return "";

    const groupProduct = addedProducts.find((product) => {
      return product.sheet === parsedSheet && product.column === parsedColumn;
    });

    return groupProduct?.labelId ?? "";
  }

  function applyLabelToGroup(
    sheetValue: string | number,
    columnValue: string | number,
    labelId: string,
  ) {
    const parsedSheet = Number(sheetValue);
    const parsedColumn = Number(columnValue);

    if (!parsedSheet || !parsedColumn || !labelId) return;

    setAddedProducts((current) =>
      current.map((product) =>
        product.sheet === parsedSheet && product.column === parsedColumn
          ? { ...product, labelId }
          : product,
      ),
    );
  }

  function handleSheetChange(value: string) {
    setSheet(value);

    const groupLabelId = getGroupLabelId(value, column);
    if (groupLabelId) {
      setActiveLabelId(groupLabelId);
    }
  }

  function handleColumnChange(value: string) {
    setColumn(value);

    const groupLabelId = getGroupLabelId(sheet, value);
    if (groupLabelId) {
      setActiveLabelId(groupLabelId);
    }
  }

  function handleLabelChange(labelId: string) {
    setActiveLabelId(labelId);
    applyLabelToGroup(sheet, column, labelId);
  }

  function getLabel(labelId: string) {
    return labels.find((label) => label.id === labelId);
  }

  function goToPreview() {
  if (addedProducts.length === 0 || isRouteLoading || routeLockRef.current) return;

  routeLockRef.current = true;

  sessionStorage.setItem("revista_labels", JSON.stringify(labels));
  sessionStorage.setItem("revista_productos", JSON.stringify(addedProducts));
  sessionStorage.setItem("revista_preview_meta", JSON.stringify(revista));

  if (flow) {
    sessionStorage.setItem("revista_flow", flow);
  }

  setIsRouteLoading(true);

  const target = "/preview";

  window.setTimeout(() => {
    router.push(target);

    window.setTimeout(() => {
      if (window.location.pathname !== "/preview") {
        window.location.assign(target);
      }
    }, 700);
  }, 850);
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

          <ProductRail />

          <Intro addedProducts={addedProducts.length} revista={revista} />

          <section className="mt-4 grid gap-4">
            <div className="grid gap-4">
              <FormCard
                eyebrow="Paso 2"
                title="Etiquetas"
                subtitle="Grupos visuales para ordenar artículos"
                icon={<Tag />}
              >
                <div className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    {labels.length > 0 ? (
                      labels.map((label) => (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => handleLabelChange(label.id)}
                          className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(0,0,0,.12)] transition active:scale-[0.97] ${
                            activeLabelId === label.id ? "ring-4 ring-[#A52E64]/15" : ""
                          }`}
                          style={{ backgroundColor: label.color }}
                        >
                          <span className="h-2 w-2 rounded-full bg-white/55" />
                          {label.title}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeLabel(label.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                removeLabel(label.id);
                              }
                            }}
                            className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-black/18 text-white/90"
                            aria-label={`Eliminar etiqueta ${label.title}`}
                          >
                            ×
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-[12px] font-bold italic text-[#81777b]">
                        Primero creá una etiqueta para poder agrupar artículos.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[18px] border border-[#bdb5b9] bg-[#e8e3e5] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
                    <label className="grid gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">
                        Nueva etiqueta
                      </span>
                      <input
                        value={labelTitle}
                        onChange={(event) => setLabelTitle(event.target.value.slice(0, 30))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") createLabel();
                        }}
                        placeholder="Nombre de etiqueta"
                        className="tc-input"
                      />
                    </label>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {labelColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`h-7 w-7 rounded-full transition hover:scale-110 active:scale-95 ${
                            selectedColor === color ? "ring-4 ring-black/10" : ""
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Seleccionar color ${color}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={createLabel}
                      className="tc-primary-button mt-3 w-full"
                    >
                      Crear etiqueta
                    </button>
                  </div>
                </div>
              </FormCard>

              <FormCard
                eyebrow="Paso 3"
                title="Buscar producto"
                subtitle="Seleccioná artículo, posición y descripción"
                icon={<PackageSearch />}
              >
                <div className="grid gap-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f85]" />
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setSelectedProduct(null);
                      }}
                      placeholder="Nombre o código del producto..."
                      className="tc-input pl-9"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {!selectedProduct && query.trim().length > 0 ? (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-2"
                      >
                        {isSearching ? (
                          <EmptyBox text="Buscando productos en Zoho CRM..." />
                        ) : searchError ? (
                          <EmptyBox text={searchError} />
                        ) : searchResults.length > 0 ? (
                          searchResults.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => selectProduct(product)}
                              className="group flex min-h-[62px] items-center gap-3 rounded-[17px] border border-[#c4bcc0] bg-[#e9e4e6] px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition hover:-translate-y-0.5 hover:border-[#A52E64]/45 hover:bg-[#eee9eb] active:scale-[0.99]"
                            >
                              <ProductThumb product={product} small />

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12.5px] font-black text-[#241f22]">
                                  {product.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-[#756b70]">
                                  {product.code} · {product.category} · {product.price}
                                </span>
                              </span>

                              <ChevronRight className="h-4 w-4 shrink-0 text-[#A52E64] opacity-60 transition group-hover:translate-x-0.5" />
                            </button>
                          ))
                        ) : (
                          <EmptyBox text="No hay productos disponibles con esa búsqueda." />
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {selectedProduct ? (
                    <SelectedProductCard
                      product={selectedProduct}
                      sheet={sheet}
                      column={column}
                      row={row}
                      description={description}
                      labels={labels}
                      activeLabelId={activeLabelId}
                      onSheetChange={handleSheetChange}
                      onColumnChange={handleColumnChange}
                      onRowChange={setRow}
                      onDescriptionChange={setDescription}
                      onLabelChange={handleLabelChange}
                      onClear={clearSelection}
                      onPreview={openPreview}
                      canPreview={canPreviewSelected}
                      maxSheets={revista.maxSheets}
                      maxColumns={revista.maxColumns}
                      maxRows={revista.maxArticles}
                    />
                  ) : null}
                </div>
              </FormCard>

              <FormCard
  eyebrow="Lista"
  title="Productos agregados"
  subtitle="Organizados por hoja, columna, fila y etiqueta"
  icon={<Layers3 />}
>
                <div className="grid gap-4">
                  {addedProducts.length > 0 ? (
                    <div className="grid gap-4">
                      {groupedProducts.map((group) => (
                        <section key={group.sheetNumber} className="grid gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-[14px] font-black text-[#241f22]">
                              Hoja {group.sheetNumber}
                            </h3>
                            <span className="text-[10px] font-black text-[#81777b]">
  {group.products.length} producto{group.products.length === 1 ? "" : "s"}
</span>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {group.products.map((product) => (
                              <MiniProductCard
                                key={product.id}
                                product={product}
                                label={getLabel(product.labelId)}
                                onRemove={() => removeProduct(product.id)}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <EmptyProducts />
                  )}

                  <button
                    type="button"
                    disabled={addedProducts.length === 0 || isRouteLoading}
                    onClick={goToPreview}
                    className="tc-primary-button flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isRouteLoading ? "Cargando preview" : "Ver previa y guardar revista"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </FormCard>
            </div>
          </section>
        </motion.section>

        <PreviewModal
          product={previewProduct}
          label={previewProduct ? getLabel(previewProduct.labelId) : undefined}
          onClose={() => setPreviewProduct(null)}
          onConfirm={confirmAddProduct}
        />

        <RouteTransitionOverlay
          show={isRouteLoading}
          title="Cargando preview"
          description="Preparando la revisión final de la revista..."
        />
      </main>
    </MotionConfig>
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
            Productos
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#f4f1f3]/68 sm:text-[15px]">
            Selección, organización y composición de artículos para la revista.
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

function ProductRail() {
  return (
    <nav className="mt-4 grid gap-2 rounded-[21px] border border-[#bdb5b9] bg-[#d8d3d5] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.55)] md:grid-cols-2">
      <RailItem active icon={<PackageSearch />} title="Productos" subtitle="Actual" number="01" />
      <RailItem icon={<Eye />} title="Preview" subtitle="Final" number="02" />
    </nav>
  );
}

function RailItem({
  active,
  done,
  icon,
  title,
  subtitle,
  number,
}: {
  active?: boolean;
  done?: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  number: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-[17px] px-3 py-3 transition ${
        active
          ? "bg-[#242225] text-[#f4f1f3] shadow-[0_14px_30px_rgba(0,0,0,.22)]"
          : "text-[#332d31]"
      }`}
    >
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border ${
          active
            ? "border-[#A52E64]/35 bg-[#A52E64]"
            : done
              ? "border-[#A52E64]/25 bg-[#A52E64]/10 text-[#A52E64]"
              : "border-[#bdb5b9] bg-[#e7e2e4] text-[#A52E64]"
        } [&_svg]:h-4 [&_svg]:w-4`}
      >
        {done ? <Check className="h-4 w-4" /> : icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-black tracking-[-0.04em]">
          {title}
        </div>
        <div className={`text-[10px] font-black ${active ? "text-white/50" : "text-[#7b7277]"}`}>
          {subtitle}
        </div>
      </div>

      <span className={`text-[11px] font-black ${active ? "text-white/50" : "text-[#8a8085]"}`}>
        {number}
      </span>
    </div>
  );
}

function Intro({
  addedProducts,
  revista,
}: {
  addedProducts: number;
  revista: RevistaMeta;
}) {
  return (
    <section className="mt-4 rounded-[25px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#e9e4e6,#ded9db)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.52)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A52E64]">
            Productos
          </p>
          <h1 className="mt-1 text-[32px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22] sm:text-[44px]">
            Agregar artículos
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#655c61]">
            Buscá productos, asigná etiquetas y definí su ubicación dentro de la revista.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
          <InfoChip label="Revista" value={`#${revista.number}`} strong />
          <InfoChip label="Artículos" value={`${addedProducts}/${revista.maxArticles}`} />
        </div>
      </div>
    </section>
  );
}

function InfoChip({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
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

function FormCard({
  eyebrow,
  title,
  subtitle,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-4 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)]">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.55)] [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-[#A52E64] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#f7f2f4]">
            {eyebrow}
          </span>
          <h3 className="mt-3 text-[24px] font-black leading-none tracking-[-0.06em] text-[#241f22]">
            {title}
          </h3>
          <p className="mt-2 text-[12px] font-bold text-[#655c61]">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-[17px] border border-dashed border-[#c4bcc0] bg-[#e9e4e6] px-3 py-5 text-center text-[12px] font-bold text-[#756b70]">
      {text}
    </div>
  );
}

function SelectedProductCard({
  product,
  sheet,
  column,
  row,
  description,
  labels,
  activeLabelId,
  onSheetChange,
  onColumnChange,
  onRowChange,
  onDescriptionChange,
  onLabelChange,
  onClear,
  onPreview,
  canPreview,
  maxSheets,
  maxColumns,
  maxRows,
}: {
  product: ProductRecord;
  sheet: string;
  column: string;
  row: string;
  description: string;
  labels: ProductLabel[];
  activeLabelId: string;
  onSheetChange: (value: string) => void;
  onColumnChange: (value: string) => void;
  onRowChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onClear: () => void;
  onPreview: () => void;
  canPreview: boolean;
  maxSheets: number;
  maxColumns: number;
  maxRows: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-[20px] border border-[#A52E64]/25 bg-[#A52E64]/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
    >
      <div className="mb-3 flex items-start gap-3">
        <ProductThumb product={product} />

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[13px] font-black text-[#241f22]">
            {product.name}
          </h4>
          <p className="mt-1 text-[11px] font-bold text-[#655c61]">
            {product.code} · {product.category} · {product.price}
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#756b70] transition hover:bg-[#A52E64]/10 hover:text-[#A52E64] active:scale-95"
          aria-label="Quitar producto seleccionado"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SmallField label="Hoja">
          <input
            value={sheet}
            onChange={(event) => onSheetChange(limitedNumber(event.target.value, maxSheets))}
            placeholder="1"
            inputMode="numeric"
            min={1}
            max={maxSheets}
            className="tc-input text-center"
          />
        </SmallField>

        <SmallField label="Columna">
          <input
            value={column}
            onChange={(event) => onColumnChange(limitedNumber(event.target.value, maxColumns))}
            placeholder="1"
            inputMode="numeric"
            min={1}
            max={maxColumns}
            className="tc-input text-center"
          />
        </SmallField>

        <SmallField label="Fila">
          <input
            value={row}
            onChange={(event) => onRowChange(limitedNumber(event.target.value, maxRows))}
            placeholder="1"
            inputMode="numeric"
            min={1}
            max={maxRows}
            className="tc-input text-center"
          />
        </SmallField>
      </div>

      <p className="mt-2 text-[10.5px] font-bold leading-relaxed text-[#756b70]">
        Límites activos: hoja 1-{maxSheets}, columna 1-{maxColumns}, fila 1-{maxRows}.
      </p>

      <label className="mt-3 grid gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">
          Descripción editable
        </span>
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="min-h-[112px] w-full rounded-[14px] border border-[#b9b0b5] bg-[linear-gradient(180deg,#eee9eb,#e0dbdd)] px-3 py-3 text-[13px] font-bold leading-relaxed text-[#201a1d] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,.58)] transition focus:border-[#A52E64] focus:ring-4 focus:ring-[#A52E64]/15"
        />
      </label>

      <LabelPicker labels={labels} value={activeLabelId} onChange={onLabelChange} />

      <button
        type="button"
        onClick={onPreview}
        disabled={!canPreview}
        className="tc-primary-button mt-4 w-full disabled:cursor-not-allowed disabled:opacity-45"
      >
        Ver previa y agregar
      </button>
    </motion.section>
  );
}

function LabelPicker({
  labels,
  value,
  onChange,
}: {
  labels: ProductLabel[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = labels.find((label) => label.id === value);

  return (
    <div className="relative mt-3 grid gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">
        Etiqueta
      </span>

      <button
        type="button"
        disabled={labels.length === 0}
        onClick={() => setOpen((current) => !current)}
        className="tc-input flex items-center justify-between gap-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: selected?.color ?? "#c4bcc0" }}
          />
          <span className="truncate">
            {selected?.title ?? "Primero creá una etiqueta"}
          </span>
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#8a7f85] transition ${
            open ? "rotate-180 text-[#A52E64]" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && labels.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-[18px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-2 shadow-[0_24px_54px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.54)]"
          >
            {labels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => {
                  onChange(label.id);
                  setOpen(false);
                }}
                className={`flex min-h-11 w-full items-center gap-3 rounded-[13px] px-3 text-left text-[13px] font-black transition active:scale-[0.985] ${
                  label.id === value
                    ? "bg-[#A52E64]/10 text-[#A52E64]"
                    : "text-[#241f22] hover:bg-[#e8e3e5]"
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="min-w-0 flex-1 truncate">{label.title}</span>
                {label.id === value ? <Check className="h-4 w-4" /> : null}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MiniProductCard({
  product,
  label,
  onRemove,
}: {
  product: AddedProduct;
  label?: ProductLabel;
  onRemove: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[16px] border border-[#bdb5b9] bg-[#e9e4e6] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]">
      <div
        className="flex items-center justify-between gap-3 px-3 py-2 text-white"
        style={{ backgroundColor: label?.color ?? "#A52E64" }}
      >
        <span className="truncate text-[10.5px] font-black">
          {label?.title ?? product.category}
        </span>

        <span className="text-[10px] font-black opacity-85">
          Hoja {product.sheet} · Columna {product.column} · Fila {product.row}
        </span>
      </div>

      <div className="flex gap-3 p-3">
        <ProductThumb product={product} small />

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[12.5px] font-black text-[#241f22]">
            {product.name}
          </h4>

          <p className="mt-1 text-[10.5px] font-bold text-[#756b70]">
            Código: {product.code} · Etiqueta: {label?.title ?? "Sin etiqueta"}
          </p>

          <p className="mt-1 text-[10.5px] font-bold text-[#756b70]">
            Hoja {product.sheet} · Columna {product.column} · Fila {product.row}
          </p>

          <p className="mt-2 line-clamp-2 text-[10.5px] font-semibold leading-relaxed text-[#756b70]">
            {product.customDescription || "Sin descripción."}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#756b70] transition hover:bg-[#A52E64]/10 hover:text-[#A52E64] active:scale-95"
          aria-label={`Eliminar ${product.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function PreviewModal({
  product,
  label,
  onClose,
  onConfirm,
}: {
  product: AddedProduct | null;
  label?: ProductLabel;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-[560px] overflow-hidden rounded-[26px] border border-white/35 bg-[linear-gradient(180deg,#ebe7e8,#d9d4d6)] shadow-[0_34px_90px_rgba(0,0,0,.46),inset_0_1px_0_rgba(255,255,255,.68)]"
          >
            <div
              className="flex items-center justify-between gap-3 px-5 py-4 text-white"
              style={{ backgroundColor: label?.color ?? "#A52E64" }}
            >
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">
                  Vista previa
                </p>
                <h3 className="mt-1 text-[22px] font-black tracking-[-0.055em]">
                  Confirmar producto
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 transition hover:bg-white/25 active:scale-95"
                aria-label="Cerrar vista previa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              <div className="flex gap-4 rounded-[20px] border border-[#bdb5b9] bg-[#e7e2e4] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
                <ProductThumb product={product} />

                <div className="min-w-0 flex-1">
                  <h4 className="text-[18px] font-black leading-tight tracking-[-0.045em] text-[#241f22]">
                    {product.name}
                  </h4>
                  <p className="mt-1 text-[12px] font-bold text-[#756b70]">
                    {product.code} · {product.category} · {product.price}
                  </p>
                  <p className="mt-3 text-[12.5px] font-semibold leading-relaxed text-[#5f555a]">
                    {product.customDescription || "Sin descripción."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <InfoChip label="Hoja" value={String(product.sheet)} strong />
                <InfoChip label="Columna" value={String(product.column)} />
                <InfoChip label="Fila" value={String(product.row)} />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-12 flex-1 rounded-[16px] border border-[#bdb5b9] bg-[#e8e3e5] px-4 text-[12px] font-black text-[#332d31] transition hover:bg-[#eee9eb] active:scale-[0.99]"
                >
                  Corregir
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  className="tc-primary-button min-h-12 flex-1"
                >
                  Agregar producto
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function EmptyProducts() {
  return (
    <div className="grid gap-3 rounded-[18px] border border-dashed border-[#c4bcc0] bg-[#e9e4e6] px-4 py-7 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-[15px] bg-[#A52E64]/10 text-[#A52E64]">
        <BookOpen className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[14px] font-black text-[#241f22]">
          Todavía no hay productos agregados.
        </p>
        <p className="mt-1 text-[12px] font-bold text-[#756b70]">
          Buscá un producto, asigná posición y confirmá la vista previa.
        </p>
      </div>
    </div>
  );
}

function ProductThumb({
  product,
  small,
}: {
  product: ProductRecord;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = small ? "h-10 w-10 rounded-[12px]" : "h-12 w-12 rounded-[14px]";

  if (product.coverUrl && !failed) {
    return (
      <div
        className={`shrink-0 overflow-hidden border border-[#A52E64]/10 bg-white ${sizeClass}`}
      >
        <img
          src={product.coverUrl}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center bg-[#A52E64]/10 text-[10px] font-black text-[#A52E64] ring-1 ring-[#A52E64]/10 ${sizeClass}`}
    >
      {(product.factoryCode || product.code || product.name).slice(0, 4)}
    </div>
  );
}

function SmallField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">
        {label}
      </span>
      {children}
    </label>
  );
}

function isValidProductLabel(value: unknown): value is ProductLabel {
  if (!value || typeof value !== "object") return false;

  const label = value as Partial<ProductLabel>;

  return (
    typeof label.id === "string" &&
    label.id.trim().length > 0 &&
    typeof label.title === "string" &&
    label.title.trim().length > 0 &&
    typeof label.color === "string" &&
    label.color.trim().length > 0
  );
}

function isValidAddedProduct(value: unknown): value is AddedProduct {
  if (!value || typeof value !== "object") return false;

  const product = value as Partial<AddedProduct>;

  return (
    typeof product.id === "string" &&
    product.id.trim().length > 0 &&
    typeof product.name === "string" &&
    product.name.trim().length > 0 &&
    Number(product.sheet) > 0 &&
    Number(product.column) > 0 &&
    Number(product.row) > 0 &&
    typeof product.labelId === "string" &&
    product.labelId.trim().length > 0
  );
}

function normalizeApiProduct(product: ApiProductRecord): ProductRecord | null {
  const id = product.id?.trim();
  const name = product.nombre?.trim();

  if (!id || !name) return null;

  return {
    id,
    name,
    code: product.codigo?.trim() || id,
    factoryCode: product.codigoFabrica?.trim() || product.codigo?.trim() || id,
    brand: product.marca?.trim() || "",
    category: product.tipoMaquina?.trim() || "Producto",
    price: product.precioFormateado?.trim() || formatGs(product.precioNumero),
    priceNumber: Number(product.precioNumero) || 0,
    priceBookName: product.priceBookName?.trim() || "",
    description: product.descripcion?.trim() || "",
    coverUrl: normalizeCoverUrl(product.portadaUrl),
  };
}

function normalizeCoverUrl(value: unknown) {
  if (typeof value !== "string") return "";

  const clean = value.trim();
  if (!clean) return "";

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  if (clean.startsWith("/")) {
    return build_api_url(clean);
  }

  return clean;
}

function formatGs(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "Gs. 0";

  return `Gs. ${new Intl.NumberFormat("es-PY").format(number)}`;
}

function onlyNumber(value: string) {
  return value.replace(/\D/g, "");
}

function limitedNumber(value: string, max: number) {
  const clean = onlyNumber(value);
  if (!clean) return "";

  return String(Math.min(max, Math.max(1, Number(clean))));
}

function clampLimit(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
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