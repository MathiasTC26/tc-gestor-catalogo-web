"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, Eye, FileText, Layers3, PackageSearch, Search, Sparkles, Tag, Trash2, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type ProductLabel = { id: string; title: string; color: string };
type ProductRecord = { id: string; name: string; code: string; factoryCode: string; brand: string; category: string; price: string; description: string };
type AddedProduct = ProductRecord & { sheet: number; column: number; row: number; labelId: string; customDescription: string };

const labelColors = ["#A52E64", "#7d1d49", "#8e44ad", "#2980b9", "#00897b", "#27ae60", "#d4a017", "#e67e22", "#c0392b", "#546e7a"];
const revista = { number: 128, title: "Catálogo Primavera 2025", client: "Todo Costura S.A.", maxSheets: 18, maxColumns: 4, maxArticles: 48 };
const mockProducts: ProductRecord[] = [
  { id: "P-1001", name: "Máquina recta industrial", code: "TC-RECTA-01", factoryCode: "R-8700", brand: "Todo Costura", category: "Máquina recta", price: "2.850.000", description: "Máquina recta industrial para costura continua.\nIdeal para talleres de producción.\nAlta velocidad y estructura reforzada." },
  { id: "P-1002", name: "Overlock 5 hilos", code: "TC-OVER-05", factoryCode: "O-5500", brand: "Todo Costura", category: "Overlock", price: "3.420.000", description: "Overlock de 5 hilos para terminación profesional.\nCostura firme, limpia y de alto rendimiento." },
  { id: "P-1003", name: "Collareta industrial", code: "TC-COLL-03", factoryCode: "C-3200", brand: "Todo Costura", category: "Collareta", price: "3.100.000", description: "Collareta industrial para terminaciones de prendas.\nApta para tejidos livianos y medianos." },
];

export default function ProductsPage() {
  const [labels, setLabels] = useState<ProductLabel[]>([{ id: "lbl-1", title: "Máquinas", color: "#A52E64" }]);
  const [labelTitle, setLabelTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(labelColors[0]);
  const [activeLabelId, setActiveLabelId] = useState("lbl-1");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [sheet, setSheet] = useState("");
  const [column, setColumn] = useState("");
  const [row, setRow] = useState("1");
  const [description, setDescription] = useState("");
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [previewProduct, setPreviewProduct] = useState<AddedProduct | null>(null);

  const filteredProducts = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return mockProducts.filter((product) => {
      if (addedProducts.some((item) => item.id === product.id)) return false;
      if (!clean) return true;
      return `${product.name} ${product.code} ${product.factoryCode} ${product.category}`.toLowerCase().includes(clean);
    });
  }, [addedProducts, query]);

  const progress = Math.round((addedProducts.length / revista.maxArticles) * 100);
  const groupedProducts = useMemo(() => {
    const groups = new Map<number, AddedProduct[]>();
    for (const product of addedProducts) groups.set(product.sheet, [...(groups.get(product.sheet) ?? []), product]);
    return Array.from(groups.entries()).sort(([a], [b]) => a - b).map(([sheetNumber, products]) => ({ sheetNumber, products: products.sort((a, b) => a.column !== b.column ? a.column - b.column : a.row - b.row) }));
  }, [addedProducts]);

  function createLabel() {
    const title = labelTitle.trim();
    if (!title || labels.some((label) => label.title.toLowerCase() === title.toLowerCase())) return;
    const nextLabel = { id: `lbl-${Date.now()}`, title, color: selectedColor };
    setLabels((current) => [...current, nextLabel]);
    setActiveLabelId(nextLabel.id);
    setLabelTitle("");
  }

  function removeLabel(id: string) {
    if (addedProducts.some((product) => product.labelId === id)) return;
    setLabels((current) => current.filter((label) => label.id !== id));
    if (activeLabelId === id) setActiveLabelId(labels.find((label) => label.id !== id)?.id ?? "");
  }

  function selectProduct(product: ProductRecord) {
    setSelectedProduct(product);
    setQuery(product.name);
    setDescription(product.description);
    setSheet("");
    setColumn("");
    setRow("1");
    if (!activeLabelId && labels[0]) setActiveLabelId(labels[0].id);
  }

  function clearSelection() {
    setSelectedProduct(null);
    setQuery("");
    setDescription("");
    setSheet("");
    setColumn("");
    setRow("1");
  }

  function buildPendingProduct() {
    if (!selectedProduct || !activeLabelId) return null;
    const parsedSheet = Number(sheet);
    const parsedColumn = Number(column);
    const parsedRow = Number(row || "1");
    if (!parsedSheet || !parsedColumn || !parsedRow) return null;
    if (parsedSheet < 1 || parsedSheet > revista.maxSheets) return null;
    if (parsedColumn < 1 || parsedColumn > revista.maxColumns) return null;
    if (addedProducts.some((product) => product.sheet === parsedSheet && product.column === parsedColumn && product.row === parsedRow)) return null;
    return { ...selectedProduct, sheet: parsedSheet, column: parsedColumn, row: parsedRow, labelId: activeLabelId, customDescription: description.trim() };
  }

  function openPreview() {
    const pending = buildPendingProduct();
    if (pending) setPreviewProduct(pending);
  }

  function confirmAddProduct() {
    if (!previewProduct) return;
    setAddedProducts((current) => [...current, previewProduct]);
    setPreviewProduct(null);
    clearSelection();
  }

  function getLabel(labelId: string) { return labels.find((label) => label.id === labelId); }

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden bg-[#101011] px-3 py-4 text-[#221d20] sm:px-5 lg:px-7">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-18%,rgba(255,255,255,.08),transparent_32%),linear-gradient(180deg,#151416_0%,#101011_72%)]" />
        <motion.section initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-[1180px] rounded-[30px] border border-white/35 bg-[linear-gradient(145deg,#e4dfe1,#d5d0d2_62%,#cbc5c8)] p-3 shadow-[0_34px_90px_rgba(0,0,0,.42),inset_0_1px_0_rgba(255,255,255,.75)] sm:p-5">
          <AppHeader progress={progress} />
          <ProductRail />
          <Intro addedProducts={addedProducts.length} />

          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              <FormCard eyebrow="Paso 2" title="Etiquetas" subtitle="Grupos visuales para ordenar artículos" icon={<Tag />}>
                <div className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <button key={label.id} type="button" onClick={() => setActiveLabelId(label.id)} className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(0,0,0,.12)] transition active:scale-[0.97] ${activeLabelId === label.id ? "ring-4 ring-[#A52E64]/15" : ""}`} style={{ backgroundColor: label.color }}>
                        <span className="h-2 w-2 rounded-full bg-white/55" />{label.title}
                        <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); removeLabel(label.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); removeLabel(label.id); } }} className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-black/18 text-white/90" aria-label={`Eliminar etiqueta ${label.title}`}>×</span>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-[18px] border border-[#bdb5b9] bg-[#e8e3e5] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
                    <label className="grid gap-1.5"><span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">Nueva etiqueta</span><input value={labelTitle} onChange={(event) => setLabelTitle(event.target.value.slice(0, 30))} onKeyDown={(event) => { if (event.key === "Enter") createLabel(); }} placeholder="Ej: Máquinas" className="tc-input" /></label>
                    <div className="mt-3 flex flex-wrap gap-2">{labelColors.map((color) => <button key={color} type="button" onClick={() => setSelectedColor(color)} className={`h-7 w-7 rounded-full transition hover:scale-110 active:scale-95 ${selectedColor === color ? "ring-4 ring-black/10" : ""}`} style={{ backgroundColor: color }} aria-label={`Seleccionar color ${color}`} />)}</div>
                    <button type="button" onClick={createLabel} className="tc-primary-button mt-3 w-full">Crear etiqueta</button>
                  </div>
                </div>
              </FormCard>

              <FormCard eyebrow="Paso 3" title="Buscar producto" subtitle="Seleccioná artículo, posición y descripción" icon={<PackageSearch />}>
                <div className="grid gap-3">
                  <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f85]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedProduct(null); }} placeholder="Nombre o código del producto..." className="tc-input pl-9" /></div>
                  <AnimatePresence mode="wait">{!selectedProduct && query.trim().length > 0 ? <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="grid gap-2">{filteredProducts.length > 0 ? filteredProducts.map((product) => <button key={product.id} type="button" onClick={() => selectProduct(product)} className="group flex min-h-[62px] items-center gap-3 rounded-[17px] border border-[#c4bcc0] bg-[#e9e4e6] px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition hover:-translate-y-0.5 hover:border-[#A52E64]/45 hover:bg-[#eee9eb] active:scale-[0.99]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#A52E64]/10 text-[11px] font-black text-[#A52E64] ring-1 ring-[#A52E64]/10">{product.factoryCode.slice(0, 4)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-black text-[#241f22]">{product.name}</span><span className="mt-0.5 block truncate text-[10.5px] font-semibold text-[#756b70]">{product.code} · {product.category} · Gs. {product.price}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-[#A52E64] opacity-60 transition group-hover:translate-x-0.5" /></button>) : <EmptyBox text="No hay productos disponibles con esa búsqueda." />}</motion.div> : null}</AnimatePresence>
                  {selectedProduct ? <SelectedProductCard product={selectedProduct} sheet={sheet} column={column} row={row} description={description} labels={labels} activeLabelId={activeLabelId} onSheetChange={setSheet} onColumnChange={setColumn} onRowChange={setRow} onDescriptionChange={setDescription} onLabelChange={setActiveLabelId} onClear={clearSelection} onPreview={openPreview} /> : null}
                </div>
              </FormCard>
            </div>
            <aside className="grid gap-4 lg:sticky lg:top-6 lg:self-start">
              <SummaryPanel addedProducts={addedProducts} progress={progress} />
              <FormCard eyebrow="Lista" title="Productos agregados" subtitle="Agrupados por hoja y posición" icon={<Layers3 />}>{addedProducts.length > 0 ? <div className="grid gap-4">{groupedProducts.map((group) => <section key={group.sheetNumber} className="grid gap-2"><div className="flex items-center justify-between gap-3"><h3 className="text-[14px] font-black text-[#241f22]">Hoja {group.sheetNumber}</h3><span className="text-[10px] font-black text-[#81777b]">{group.products.length} art.</span></div><div className="grid gap-2">{group.products.map((product) => <MiniProductCard key={product.id} product={product} label={getLabel(product.labelId)} onRemove={() => setAddedProducts((current) => current.filter((item) => item.id !== product.id))} />)}</div></section>)}</div> : <EmptyProducts />}</FormCard>
            </aside>
          </section>
          <MobileFooter progress={progress} />
        </motion.section>
        <PreviewModal product={previewProduct} label={previewProduct ? getLabel(previewProduct.labelId) : undefined} onClose={() => setPreviewProduct(null)} onConfirm={confirmAddProduct} />
      </main>
    </MotionConfig>
  );
}

function AppHeader({ progress }: { progress: number }) { return <header className="tc-sheen relative overflow-hidden rounded-[26px] bg-[#232124] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:p-5"><div className="relative z-10 grid gap-4 sm:grid-cols-[104px_1fr_auto] sm:items-center"><div className="grid h-[88px] w-[88px] place-items-center rounded-[24px] border border-white/25 bg-white p-3 shadow-[0_20px_38px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.65)] sm:h-[104px] sm:w-[104px]"><img src="/Todo-Costura.png" alt="Todo Costura" className="max-h-full max-w-full object-contain" /></div><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#d9b9c9]">Centro operativo</p><h2 className="mt-1 text-[38px] font-black leading-[0.9] tracking-[-0.075em] text-[#f4f1f3] sm:text-[56px] lg:text-[66px]">Productos</h2><p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#f4f1f3]/68 sm:text-[15px]">Selección, organización y composición de artículos para la revista.</p></div><div className="rounded-[18px] border border-white/10 bg-white/[0.055] px-4 py-3"><span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/44">Avance</span><span className="mt-1 block text-[26px] font-black tracking-[-0.06em] text-[#f4f1f3]">{progress}%</span></div></div></header>; }
function ProductRail() { return <nav className="mt-4 grid gap-2 rounded-[21px] border border-[#bdb5b9] bg-[#d8d3d5] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.55)] md:grid-cols-3"><RailItem done icon={<FileText />} title="Datos" subtitle="Completado" number="01" /><RailItem active icon={<PackageSearch />} title="Productos" subtitle="Actual" number="02" /><RailItem icon={<Eye />} title="Preview" subtitle="Final" number="03" /></nav>; }
function RailItem({ active, done, icon, title, subtitle, number }: { active?: boolean; done?: boolean; icon: ReactNode; title: string; subtitle: string; number: string }) { return <div className={`flex items-center gap-3 rounded-[17px] px-3 py-3 transition ${active ? "bg-[#242225] text-[#f4f1f3] shadow-[0_14px_30px_rgba(0,0,0,.22)]" : "text-[#332d31]"}`}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border ${active ? "border-[#A52E64]/35 bg-[#A52E64]" : done ? "border-[#A52E64]/25 bg-[#A52E64]/10 text-[#A52E64]" : "border-[#bdb5b9] bg-[#e7e2e4] text-[#A52E64]"} [&_svg]:h-4 [&_svg]:w-4`}>{done ? <Check className="h-4 w-4" /> : icon}</div><div className="min-w-0 flex-1"><div className="truncate text-[16px] font-black tracking-[-0.04em]">{title}</div><div className={`text-[10px] font-black ${active ? "text-white/50" : "text-[#7b7277]"}`}>{subtitle}</div></div><span className={`text-[11px] font-black ${active ? "text-white/50" : "text-[#8a8085]"}`}>{number}</span></div>; }
function Intro({ addedProducts }: { addedProducts: number }) { return <section className="mt-4 rounded-[25px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#e9e4e6,#ded9db)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.52)] sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A52E64]">Productos</p><h1 className="mt-1 text-[32px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22] sm:text-[44px]">Agregar artículos</h1><p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#655c61]">Buscá productos, asigná etiquetas y definí su ubicación dentro de la revista.</p></div><div className="grid grid-cols-2 gap-2 sm:min-w-[260px]"><InfoChip label="Revista" value={`#${revista.number}`} strong /><InfoChip label="Artículos" value={`${addedProducts}/${revista.maxArticles}`} /></div></div></section>; }
function InfoChip({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="rounded-[18px] border border-[#bdb5b9] bg-[#e5e0e2] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]"><span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[#81777c]">{label}</span><span className={`mt-1 block truncate text-[15px] font-black leading-none tracking-[-0.04em] ${strong ? "text-[#A52E64]" : "text-[#241f22]"}`}>{value}</span></div>; }
function FormCard({ eyebrow, title, subtitle, icon, children }: { eyebrow: string; title: string; subtitle: string; icon: ReactNode; children: ReactNode }) { return <section className="rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-4 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)]"><div className="mb-4 flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.55)] [&_svg]:h-5 [&_svg]:w-5">{icon}</div><div className="min-w-0 flex-1"><span className="rounded-full bg-[#A52E64] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#f7f2f4]">{eyebrow}</span><h3 className="mt-3 text-[24px] font-black leading-none tracking-[-0.06em] text-[#241f22]">{title}</h3><p className="mt-2 text-[12px] font-bold text-[#655c61]">{subtitle}</p></div></div>{children}</section>; }
function EmptyBox({ text }: { text: string }) { return <div className="rounded-[17px] border border-dashed border-[#c4bcc0] bg-[#e9e4e6] px-3 py-5 text-center text-[12px] font-bold text-[#756b70]">{text}</div>; }
function SelectedProductCard({ product, sheet, column, row, description, labels, activeLabelId, onSheetChange, onColumnChange, onRowChange, onDescriptionChange, onLabelChange, onClear, onPreview }: { product: ProductRecord; sheet: string; column: string; row: string; description: string; labels: ProductLabel[]; activeLabelId: string; onSheetChange: (value: string) => void; onColumnChange: (value: string) => void; onRowChange: (value: string) => void; onDescriptionChange: (value: string) => void; onLabelChange: (value: string) => void; onClear: () => void; onPreview: () => void }) { return <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="rounded-[20px] border border-[#A52E64]/25 bg-[#A52E64]/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"><div className="mb-3 flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-[#A52E64]/10 text-[11px] font-black text-[#A52E64] ring-1 ring-[#A52E64]/10">{product.factoryCode.slice(0, 4)}</div><div className="min-w-0 flex-1"><h4 className="truncate text-[13px] font-black text-[#241f22]">{product.name}</h4><p className="mt-1 text-[11px] font-bold text-[#655c61]">{product.code} · {product.category} · Gs. {product.price}</p></div><button type="button" onClick={onClear} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#756b70] transition hover:bg-[#A52E64]/10 hover:text-[#A52E64] active:scale-95" aria-label="Quitar producto seleccionado"><X className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-3"><SmallField label="Hoja"><input value={sheet} onChange={(event) => onSheetChange(onlyNumber(event.target.value))} placeholder="Ej: 1" inputMode="numeric" className="tc-input text-center" /></SmallField><SmallField label="Columna"><input value={column} onChange={(event) => onColumnChange(onlyNumber(event.target.value))} placeholder="Ej: 1" inputMode="numeric" className="tc-input text-center" /></SmallField><SmallField label="Fila"><input value={row} onChange={(event) => onRowChange(onlyNumber(event.target.value))} placeholder="Ej: 1" inputMode="numeric" className="tc-input text-center" /></SmallField></div><label className="mt-3 grid gap-1.5"><span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">Descripción editable</span><textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} className="min-h-[112px] w-full rounded-[14px] border border-[#b9b0b5] bg-[linear-gradient(180deg,#eee9eb,#e0dbdd)] px-3 py-3 text-[13px] font-bold leading-relaxed text-[#201a1d] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,.58)] transition focus:border-[#A52E64] focus:ring-4 focus:ring-[#A52E64]/15" /></label><LabelPicker labels={labels} value={activeLabelId} onChange={onLabelChange} /><button type="button" onClick={onPreview} className="tc-primary-button mt-4 w-full">Ver previa y agregar</button></motion.section>; }
function LabelPicker({ labels, value, onChange }: { labels: ProductLabel[]; value: string; onChange: (value: string) => void }) { const [open, setOpen] = useState(false); const selected = labels.find((label) => label.id === value); return <div className="relative mt-3 grid gap-1.5"><span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">Etiqueta</span><button type="button" disabled={labels.length === 0} onClick={() => setOpen((current) => !current)} className="tc-input flex items-center justify-between gap-3 disabled:cursor-not-allowed disabled:opacity-50"><span className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: selected?.color ?? "#c4bcc0" }} /><span className="truncate">{selected?.title ?? "Primero creá una etiqueta"}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-[#8a7f85] transition ${open ? "rotate-180 text-[#A52E64]" : ""}`} /></button><AnimatePresence>{open && labels.length > 0 ? <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.18, ease: "easeOut" }} className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-[18px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-2 shadow-[0_24px_54px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.54)]">{labels.map((label) => <button key={label.id} type="button" onClick={() => { onChange(label.id); setOpen(false); }} className={`flex min-h-11 w-full items-center gap-3 rounded-[13px] px-3 text-left text-[13px] font-black transition active:scale-[0.985] ${label.id === value ? "bg-[#A52E64]/10 text-[#A52E64]" : "text-[#241f22] hover:bg-[#e8e3e5]"}`}><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: label.color }} /><span className="min-w-0 flex-1 truncate">{label.title}</span>{label.id === value ? <Check className="h-4 w-4" /> : null}</button>)}</motion.div> : null}</AnimatePresence></div>; }
function onlyNumber(value: string) { return value.replace(/\D/g, ""); }
function SmallField({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1.5"><span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">{label}</span>{children}</label>; }
function SummaryPanel({ addedProducts, progress }: { addedProducts: AddedProduct[]; progress: number }) { return <section className="rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-4 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)]"><div className="mb-4 flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.55)]"><Sparkles className="h-5 w-5" /></div><div><span className="rounded-full bg-[#A52E64] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#f7f2f4]">Resumen</span><h3 className="mt-3 text-[24px] font-black leading-none tracking-[-0.06em] text-[#241f22]">Composición</h3></div></div><div className="mb-4 overflow-hidden rounded-full bg-[#c8c1c5] shadow-[inset_0_1px_2px_rgba(0,0,0,.14)]"><motion.div initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.45, ease: "easeOut" }} className="h-2 rounded-full bg-[linear-gradient(90deg,#621638,#A52E64,#c45b8b)]" /></div><div className="grid gap-2"><SummaryRow label="Revista" value={`#${revista.number}`} /><SummaryRow label="Cliente" value={revista.client} /><SummaryRow label="Hojas" value={String(revista.maxSheets)} /><SummaryRow label="Agregados" value={`${addedProducts.length}/${revista.maxArticles}`} /></div><button type="button" disabled={addedProducts.length === 0} className="tc-primary-button mt-5 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40">Ver previa y guardar revista <ArrowRight className="h-4 w-4" /></button></section>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-[14px] border border-black/5 bg-[#ebe7e8]/70 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.32)]"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#81777b]">{label}</span><span className="max-w-[180px] truncate text-right text-[12px] font-black text-[#241f22]">{value}</span></div>; }
function MiniProductCard({ product, label, onRemove }: { product: AddedProduct; label?: ProductLabel; onRemove: () => void }) { return <article className="overflow-hidden rounded-[16px] border border-[#bdb5b9] bg-[#e9e4e6] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]"><div className="flex items-center justify-between gap-3 px-3 py-2 text-white" style={{ backgroundColor: label?.color ?? "#A52E64" }}><span className="truncate text-[10.5px] font-black">{product.category}</span><span className="text-[10px] font-black opacity-80">Col. {product.column} · Fila {product.row}</span></div><div className="flex gap-3 p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#A52E64]/10 text-[10px] font-black text-[#A52E64]">{product.factoryCode.slice(0, 4)}</div><div className="min-w-0 flex-1"><h4 className="truncate text-[12.5px] font-black text-[#241f22]">{product.name}</h4><p className="mt-1 text-[10.5px] font-bold text-[#756b70]">{product.code} · Grupo: {label?.title ?? "Sin etiqueta"}</p><p className="mt-2 line-clamp-2 text-[10.5px] font-semibold leading-relaxed text-[#756b70]">{product.customDescription || "Sin descripción."}</p></div><button type="button" onClick={onRemove} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 transition hover:scale-105 active:scale-95" aria-label="Quitar producto"><Trash2 className="h-4 w-4" /></button></div></article>; }
function EmptyProducts() { return <div className="rounded-[18px] border border-dashed border-[#c4bcc0] bg-[#e9e4e6] px-4 py-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-[16px] bg-[#A52E64]/10 text-[#A52E64]"><BookOpen className="h-5 w-5" /></div><p className="mt-3 text-[12px] font-bold leading-relaxed text-[#756b70]">Aún no hay productos. Buscá, etiquetá y agregá artículos desde el catálogo.</p></div>; }
function PreviewModal({ product, label, onClose, onConfirm }: { product: AddedProduct | null; label?: ProductLabel; onClose: () => void; onConfirm: () => void }) { return <AnimatePresence>{product ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-end bg-black/65 p-0 backdrop-blur-md sm:place-items-center sm:p-5" onClick={onClose}><motion.section initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} onClick={(event) => event.stopPropagation()} className="w-full max-w-[520px] rounded-t-[28px] border border-white/35 bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-4 shadow-[0_30px_90px_rgba(0,0,0,.38),inset_0_1px_0_rgba(255,255,255,.54)] sm:rounded-[28px]"><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#bdb5b9] sm:hidden" /><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A52E64]">Vista previa</p><h3 className="mt-1 text-[24px] font-black tracking-[-0.06em] text-[#241f22]">Confirmar artículo</h3></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e3e5] text-[#756b70] transition hover:text-[#A52E64]"><X className="h-4 w-4" /></button></div><div className="overflow-hidden rounded-[18px] border border-[#bdb5b9] bg-[#e9e4e6]"><div className="px-4 py-2 text-center text-[11px] font-black uppercase text-white" style={{ backgroundColor: label?.color ?? "#A52E64" }}>{product.category}</div><div className="p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A52E64]">{product.brand}</p><h4 className="mt-1 text-[18px] font-black leading-tight tracking-[-0.04em] text-[#241f22]">{product.name}</h4><p className="mt-2 text-[12px] font-bold text-[#756b70]">Art: {product.code} · Fab: {product.factoryCode} · Gs. {product.price}</p><div className="mt-4 grid grid-cols-3 gap-2"><InfoChip label="Hoja" value={String(product.sheet)} strong /><InfoChip label="Columna" value={String(product.column)} /><InfoChip label="Fila" value={String(product.row)} /></div><p className="mt-4 whitespace-pre-line rounded-[14px] border border-[#c4bcc0] bg-[#eee9eb] p-3 text-[12px] font-semibold leading-relaxed text-[#655c61]">{product.customDescription || "Sin descripción."}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.6fr]"><button type="button" onClick={onClose} className="min-h-11 rounded-[16px] border border-[#b9b0b5] bg-[#ebe7e8] px-4 text-[13px] font-black text-[#756b70] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#e4dfe1] active:scale-[0.985]">Cancelar</button><button type="button" onClick={onConfirm} className="tc-primary-button">Confirmar y agregar</button></div></motion.section></motion.div> : null}</AnimatePresence>; }
function MobileFooter({ progress }: { progress: number }) { return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[linear-gradient(to_top,rgba(16,16,17,.98)_70%,rgba(16,16,17,.78)_88%,transparent)] px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-5 backdrop-blur-md lg:hidden"><div className="mx-auto grid max-w-[440px] gap-2"><div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/46"><span>Productos</span><span className="text-[#f4f1f3]">{progress}%</span></div><button className="tc-primary-button flex w-full items-center justify-center gap-2">Ver previa y guardar revista <ArrowRight className="h-4 w-4" /></button></div></div>; }
