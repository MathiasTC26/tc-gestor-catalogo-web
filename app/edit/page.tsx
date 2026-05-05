"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Contact,
  FilePenLine,
  PackageSearch,
  Save,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { RouteTransitionOverlay } from "@/app/_components/route-transition-overlay";
import { useMemo, useRef, useState, type ReactNode } from "react";

type ClientType = "contacto" | "empresa";

type ClientRecord = {
  id: string;
  type: ClientType;
  priceType: string;
  name: string;
  code: string;
  ci?: string;
  ruc?: string;
  phone?: string;
  email?: string;
  company?: string;
};

type RevistaRecord = {
  id: string;
  number: number;
  name: string;
  edition: string;
  publicationDate: string;
  price: string;
  printRuns: number;
  maxSheets: number;
  maxArticles: number;
  columns: number;
  client: ClientRecord;
};

const limits = {
  nameMax: 60,
  editionMax: 30,
  priceMax: 999999999,
  printRunsMax: 100000,
  sheetsMax: 50,
  articlesMax: 150,
  columnsMax: 4,
};

const clientCatalog: ClientRecord[] = [];

const revistaCatalog: RevistaRecord[] = [];

export default function EditPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedRevista, setSelectedRevista] = useState<RevistaRecord | null>(null);

  const [name, setName] = useState("");
  const [edition, setEdition] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [price, setPrice] = useState("");
  const [printRuns, setPrintRuns] = useState(1);
  const [maxSheets, setMaxSheets] = useState(1);
  const [maxArticles, setMaxArticles] = useState(1);
  const [columns, setColumns] = useState(1);

  const [originalClient, setOriginalClient] = useState<ClientRecord | null>(null);
  const [workingClient, setWorkingClient] = useState<ClientRecord | null>(null);
  const [changeClient, setChangeClient] = useState(false);
  const [clientQuery, setClientQuery] = useState("");

  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const saveLockRef = useRef(false);
  const routeLockRef = useRef(false);

  const filteredRevistas = useMemo(() => {
    const clean = query.trim().toLowerCase();

    if (!clean) return [];

    return revistaCatalog.filter((revista) => {
      return `${revista.number} ${revista.name} ${revista.edition} ${revista.client.name} ${revista.client.code}`
        .toLowerCase()
        .includes(clean);
    });
  }, [query]);

  const filteredClients = useMemo(() => {
    if (!originalClient || !changeClient) return [];

    const clean = clientQuery.trim().toLowerCase();

    return clientCatalog
      .filter((client) => client.type === originalClient.type)
      .filter((client) => {
        if (!clean) return true;

        return `${client.name} ${client.code} ${client.ci ?? ""} ${client.ruc ?? ""}`
          .toLowerCase()
          .includes(clean);
      });
  }, [changeClient, clientQuery, originalClient]);

  const progress = selectedRevista ? (dirty ? 72 : 100) : 25;

  const canSave = useMemo(() => {
    if (!selectedRevista) return false;
    if (!name.trim()) return false;
    if (!publicationDate) return false;
    if (!workingClient) return false;
    if (name.length > limits.nameMax) return false;
    if (edition.length > limits.editionMax) return false;
    if (printRuns < 1 || printRuns > limits.printRunsMax) return false;
    if (maxSheets < 1 || maxSheets > limits.sheetsMax) return false;
    if (maxArticles < 1 || maxArticles > limits.articlesMax) return false;
    if (columns < 1 || columns > limits.columnsMax) return false;

    const numericPrice = normalizeMoneyNumber(price);
    if (numericPrice > limits.priceMax) return false;

    return true;
  }, [
    columns,
    edition,
    maxArticles,
    maxSheets,
    name,
    price,
    printRuns,
    publicationDate,
    selectedRevista,
    workingClient,
  ]);

  const canContinue = Boolean(selectedRevista && workingClient && !dirty);

  function markDirty() {
    if (!selectedRevista) return;

    setDirty(true);
    setSaved(false);
  }

  function loadRevista(revista: RevistaRecord) {
    setSelectedRevista(revista);
    setName(revista.name);
    setEdition(revista.edition);
    setPublicationDate(revista.publicationDate);
    setPrice(revista.price);
    setPrintRuns(revista.printRuns);
    setMaxSheets(revista.maxSheets);
    setMaxArticles(revista.maxArticles);
    setColumns(revista.columns);
    setOriginalClient(revista.client);
    setWorkingClient(revista.client);
    setChangeClient(false);
    setClientQuery("");
    setDirty(false);
    setSaved(false);
    setQuery(`#${revista.number} · ${revista.name}`);
  }

  function updateMoney(value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 9);
    const formatted = clean ? Number(clean).toLocaleString("es-PY") : "";

    setPrice(formatted);
    markDirty();
  }

  function updateNumber(
    setter: (value: number) => void,
    value: number,
    min: number,
    max: number,
  ) {
    setter(Math.min(max, Math.max(min, value)));
    markDirty();
  }

  function selectClient(client: ClientRecord) {
    setWorkingClient(client);
    setClientQuery(client.name);
    markDirty();
  }

  function saveChanges() {
    if (
      !selectedRevista ||
      !workingClient ||
      !canSave ||
      !dirty ||
      saved ||
      isSavingChanges ||
      isRouteLoading ||
      saveLockRef.current
    ) return;

    saveLockRef.current = true;
    setIsSavingChanges(true);

    window.setTimeout(() => {
      const updated: RevistaRecord = {
        ...selectedRevista,
        name: name.trim(),
        edition: edition.trim(),
        publicationDate,
        price,
        printRuns,
        maxSheets,
        maxArticles,
        columns,
        client: workingClient,
      };

      setSelectedRevista(updated);
      setOriginalClient(workingClient);
      setChangeClient(false);
      setClientQuery("");
      setDirty(false);
      setSaved(true);

      sessionStorage.setItem(
        "revista_preview_meta",
        JSON.stringify({
          number: updated.number,
          title: updated.name,
          client: updated.client.name,
          maxSheets: updated.maxSheets,
          maxColumns: updated.columns,
          maxArticles: updated.maxArticles,
        }),
      );

      setIsSavingChanges(false);
      saveLockRef.current = false;
    }, 900);
  }

  function continueToProducts() {
    if (!selectedRevista || !workingClient || !canContinue || isSavingChanges || isRouteLoading || routeLockRef.current) return;

    routeLockRef.current = true;

    sessionStorage.setItem(
      "revista_preview_meta",
      JSON.stringify({
        number: selectedRevista.number,
        title: name.trim() || selectedRevista.name,
        client: workingClient.name,
        maxSheets,
        maxColumns: columns,
        maxArticles,
      }),
    );

    setIsRouteLoading(true);

    window.setTimeout(() => {
      router.push("/products");
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

          <EditRail selected={Boolean(selectedRevista)} dirty={dirty} />

          <Intro selectedRevista={selectedRevista} dirty={dirty} saved={saved} />

          <section className="mt-4 grid gap-4">
            <div className="grid gap-4">
              <FormCard
                eyebrow="Paso 1"
                title="Buscar revista"
                subtitle="Número, nombre, cliente o edición"
                icon={<Search />}
              >
                <div className="grid gap-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f85]" />
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setSelectedRevista(null);
                        setDirty(false);
                        setSaved(false);
                      }}
                      placeholder="Buscar por número, nombre, cliente o edición"
                      className="tc-input pl-9"
                    />
                  </div>

                  {!selectedRevista ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid gap-2"
                    >
                      {filteredRevistas.length > 0 ? (
                        filteredRevistas.map((revista) => (
                          <button
                            key={revista.id}
                            type="button"
                            onClick={() => loadRevista(revista)}
                            className="group flex min-h-[66px] items-center gap-3 rounded-[17px] border border-[#c4bcc0] bg-[#e9e4e6] px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition hover:-translate-y-0.5 hover:border-[#A52E64]/45 hover:bg-[#eee9eb] active:scale-[0.99]"
                          >
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-[#A52E64]/10 text-[12px] font-black text-[#A52E64] ring-1 ring-[#A52E64]/10">
                              #{revista.number}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-black text-[#241f22]">
                                {revista.name}
                              </span>
                              <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-[#756b70]">
                                {revista.client.name} · {revista.edition} · {formatDisplayDate(revista.publicationDate)}
                              </span>
                            </span>

                            <ChevronRight className="h-4 w-4 shrink-0 text-[#A52E64] opacity-60 transition group-hover:translate-x-0.5" />
                          </button>
                        ))
                      ) : (
                        <EmptyBox text="No hay revistas disponibles con esa búsqueda." />
                      )}
                    </motion.div>
                  ) : null}
                </div>
              </FormCard>


              <AnimatePresence>
                {selectedRevista ? (
                  <motion.div
                    key="edit-content"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="grid gap-4"
                  >
                    <FormCard
                      eyebrow="Paso 2"
                      title="Cliente"
                      subtitle="Conservá o reemplazá el cliente actual"
                      icon={<Contact />}
                    >
                      <div className="grid gap-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <ChoiceButton
                            active={!changeClient}
                            onClick={() => {
                              setChangeClient(false);
                              setWorkingClient(originalClient);
                              setClientQuery("");
                              markDirty();
                            }}
                          >
                            Conservar cliente
                          </ChoiceButton>

                          <ChoiceButton
                            active={changeClient}
                            onClick={() => {
                              setChangeClient(true);
                              setWorkingClient(null);
                              setClientQuery("");
                              markDirty();
                            }}
                          >
                            Cambiar cliente
                          </ChoiceButton>
                        </div>

                        {workingClient && !changeClient ? (
                          <ClientCard client={workingClient} />
                        ) : null}

                        {changeClient ? (
                          <div className="grid gap-3 rounded-[18px] border border-[#bdb5b9] bg-[#e8e3e5] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[12px] font-black text-[#241f22]">
                                  Buscar cliente
                                </p>
                                <p className="mt-1 text-[11px] font-bold text-[#756b70]">
                                  Solo se muestran clientes del mismo tipo.
                                </p>
                              </div>

                              <span className="rounded-full bg-[#A52E64]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#A52E64]">
                                {originalClient?.type === "empresa" ? "Empresa" : "Contacto"}
                              </span>
                            </div>

                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f85]" />
                              <input
                                value={clientQuery}
                                onChange={(event) => {
                                  setClientQuery(event.target.value);
                                  setWorkingClient(null);
                                }}
                                placeholder={
                                  originalClient?.type === "empresa"
                                    ? "Nombre de empresa o RUC..."
                                    : "Nombre o CI..."
                                }
                                className="tc-input pl-9"
                              />
                            </div>

                            {!workingClient ? (
                              <div className="grid gap-2">
                                {filteredClients.map((client) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => selectClient(client)}
                                    className="group flex min-h-[58px] items-center gap-3 rounded-[16px] border border-[#c4bcc0] bg-[#e9e4e6] px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition hover:-translate-y-0.5 hover:border-[#A52E64]/45 hover:bg-[#eee9eb] active:scale-[0.99]"
                                  >
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#A52E64]/10 text-[#A52E64] ring-1 ring-[#A52E64]/10">
                                      {client.type === "empresa" ? (
                                        <Building2 className="h-4 w-4" />
                                      ) : (
                                        <Contact className="h-4 w-4" />
                                      )}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[12px] font-black text-[#241f22]">
                                        {client.name}
                                      </span>
                                      <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-[#756b70]">
                                        {client.code} · {client.ruc || client.ci || "Sin documento"} · {client.priceType}
                                      </span>
                                    </span>

                                    <ChevronRight className="h-4 w-4 shrink-0 text-[#A52E64] opacity-60 transition group-hover:translate-x-0.5" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <ClientCard client={workingClient} />
                            )}
                          </div>
                        ) : null}
                      </div>
                    </FormCard>

                    <FormCard
                      eyebrow="Paso 3"
                      title="Datos editables"
                      subtitle="Cabecera y parámetros de la revista"
                      icon={<FilePenLine />}
                    >
                      <div className="grid gap-3">
                        <Field label="Nombre de revista">
                          <input
                            value={name}
                            onChange={(event) => {
                              setName(event.target.value.slice(0, limits.nameMax));
                              markDirty();
                            }}
                            placeholder="Nombre de la revista"
                            className="tc-input text-[15px] font-black tracking-[-0.02em]"
                          />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Fecha publicación">
                            <DatePicker
                              value={publicationDate}
                              onChange={(value) => {
                                setPublicationDate(value);
                                markDirty();
                              }}
                            />
                          </Field>

                          <Field label="Edición">
                            <input
                              value={edition}
                              onChange={(event) => {
                                setEdition(event.target.value.slice(0, limits.editionMax));
                                markDirty();
                              }}
                              placeholder="Edición"
                              className="tc-input"
                            />
                          </Field>
                        </div>

                        <Field label="Precio revista / opcional">
                          <input
                            value={price}
                            onChange={(event) => updateMoney(event.target.value)}
                            inputMode="numeric"
                            placeholder="Máximo: 999.999.999"
                            className="tc-input"
                          />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <NumberControl
                            label="Tiradas"
                            value={printRuns}
                            min={1}
                            max={limits.printRunsMax}
                            onChange={(value) =>
                              updateNumber(setPrintRuns, value, 1, limits.printRunsMax)
                            }
                          />
                          <NumberControl
                            label="Máx. hojas"
                            value={maxSheets}
                            min={1}
                            max={limits.sheetsMax}
                            onChange={(value) =>
                              updateNumber(setMaxSheets, value, 1, limits.sheetsMax)
                            }
                          />
                          <NumberControl
                            label="Máx. artículos"
                            value={maxArticles}
                            min={1}
                            max={limits.articlesMax}
                            onChange={(value) =>
                              updateNumber(setMaxArticles, value, 1, limits.articlesMax)
                            }
                          />
                          <NumberControl
                            label="Columnas"
                            value={columns}
                            min={1}
                            max={limits.columnsMax}
                            onChange={(value) =>
                              updateNumber(setColumns, value, 1, limits.columnsMax)
                            }
                          />
                        </div>
                      </div>
                    </FormCard>

                    <EditActionsPanel
                      dirty={dirty}
                      saved={saved}
                      canSave={canSave && dirty && !saved && !isSavingChanges && !isRouteLoading}
                      canContinue={canContinue && !isSavingChanges && !isRouteLoading}
                      isSaving={isSavingChanges}
                      isRouteLoading={isRouteLoading}
                      onSave={saveChanges}
                      onContinue={continueToProducts}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </section>
        </motion.section>
      </main>

      <RouteTransitionOverlay
        show={isSavingChanges || isRouteLoading}
        title={isSavingChanges ? "Guardando cambios" : "Cargando productos"}
        description={
          isSavingChanges
            ? "Actualizando los datos de la revista..."
            : "Preparando la sección de artículos..."
        }
      />
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
            Editar revista
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#f4f1f3]/68 sm:text-[15px]">
            Buscá una revista existente, ajustá sus datos y continuá al flujo de productos.
          </p>
        </div>

        <div className="rounded-[18px] border border-white/10 bg-white/[0.055] px-4 py-3">
          <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/44">
            Estado
          </span>
          <span className="mt-1 block text-[26px] font-black tracking-[-0.06em] text-[#f4f1f3]">
            {progress}%
          </span>
        </div>
      </div>
    </header>
  );
}

function EditRail({ selected, dirty }: { selected: boolean; dirty: boolean }) {
  return (
    <nav className="mt-4 grid gap-2 rounded-[21px] border border-[#bdb5b9] bg-[#d8d3d5] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.55)] md:grid-cols-3">
      <RailItem active={!selected} done={selected} icon={<Search />} title="Buscar" subtitle="Revista" number="01" />
      <RailItem active={selected && dirty} done={selected && !dirty} icon={<FilePenLine />} title="Editar" subtitle="Datos" number="02" />
      <RailItem active={selected && !dirty} icon={<PackageSearch />} title="Productos" subtitle="Continuar" number="03" />
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
        <div className="truncate text-[16px] font-black tracking-[-0.04em]">{title}</div>
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
  selectedRevista,
  dirty,
  saved,
}: {
  selectedRevista: RevistaRecord | null;
  dirty: boolean;
  saved: boolean;
}) {
  return (
    <section className="mt-4 rounded-[25px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#e9e4e6,#ded9db)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.52)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A52E64]">
            Edición
          </p>
          <h1 className="mt-1 text-[32px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22] sm:text-[44px]">
            {selectedRevista ? `Revista #${selectedRevista.number}` : "Seleccionar revista"}
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#655c61]">
            {selectedRevista
              ? "Actualizá datos generales, cliente y parámetros antes de continuar."
              : "Buscá una revista existente para habilitar la edición."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
          <InfoChip
            label="Estado"
            value={!selectedRevista ? "Pendiente" : dirty ? "Sin guardar" : saved ? "Guardado" : "Listo"}
            strong
          />
          <InfoChip label="Modo" value="Web" />
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-[15px] border px-4 text-[12.5px] font-black transition active:scale-[0.985] ${
        active
          ? "border-[#A52E64] bg-[#A52E64]/10 text-[#A52E64] shadow-[0_0_0_4px_rgba(165,46,100,.10),inset_0_1px_0_rgba(255,255,255,.36)]"
          : "border-[#b9b0b5] bg-[linear-gradient(180deg,#eee9eb,#dfdadd)] text-[#62595d] shadow-[inset_0_1px_0_rgba(255,255,255,.46)] hover:border-[#A52E64]/40 hover:bg-[#e8e3e5]"
      }`}
    >
      {children}
    </button>
  );
}

function ClientCard({ client }: { client: ClientRecord }) {
  return (
    <section className="rounded-[18px] border border-[#A52E64]/25 bg-[#A52E64]/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[linear-gradient(135deg,#761d46,#A52E64)] text-[#f7f2f4] shadow-[0_10px_22px_rgba(165,46,100,.24)]">
          {client.type === "empresa" ? <Building2 className="h-4 w-4" /> : <Contact className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-[#241f22]">{client.name}</p>
          <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#62595d]">
            {client.type === "empresa" ? "Empresa" : "Contacto"} · {client.priceType} · {client.code}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DataPill label="CI" value={client.ci ?? "—"} />
            <DataPill label="RUC" value={client.ruc ?? "—"} />
            <DataPill label="Teléfono" value={client.phone ?? "—"} />
            <DataPill label="Correo" value={client.email ?? "—"} />
            <DataPill label="Detalle" value={client.company ?? "Cuenta seleccionada"} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[13px] border border-[#c4bcc0] bg-[#eee9eb] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]">
      <p className="text-[8.5px] font-black uppercase tracking-[0.13em] text-[#A52E64]">
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-bold text-[#655c61]">{value}</p>
    </div>
  );
}

function NumberControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5f555a]">
          {label}
        </span>
        <span className="text-[8.5px] font-black text-[#8a8085]">
          máx. {max.toLocaleString("es-PY")}
        </span>
      </div>

      <div className="grid min-h-11 grid-cols-[42px_1fr_42px] overflow-hidden rounded-[14px] border border-[#b9b0b5] bg-[linear-gradient(180deg,#eee9eb,#e0dbdd)] shadow-[inset_0_1px_0_rgba(255,255,255,.58)] transition focus-within:border-[#A52E64] focus-within:ring-4 focus-within:ring-[#A52E64]/15">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          className="grid place-items-center text-[#A52E64] transition hover:bg-[#A52E64]/10 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30"
        >
          -
        </button>

        <input
          value={value}
          onChange={(event) => onChange(Number(event.target.value.replace(/\D/g, "")) || min)}
          inputMode="numeric"
          className="min-w-0 border-x border-[#c4bcc0] bg-transparent text-center text-[14px] font-black text-[#201a1d] outline-none"
        />

        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="grid place-items-center text-[#A52E64] transition hover:bg-[#A52E64]/10 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 13);
  maxDate.setHours(0, 0, 0, 0);

  const selected = value ? new Date(`${value}T00:00:00`) : null;

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selected ?? today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const minViewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxViewMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const currentViewMonth = new Date(year, month, 1);

  const canGoPrev = currentViewMonth > minViewMonth;
  const canGoNext = currentViewMonth < maxViewMonth;

  const monthName = viewDate.toLocaleDateString("es-PY", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - startOffset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function displayDate() {
    if (!value) return "dd/mm/aaaa";

    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }

  function moveMonth(amount: number) {
    const next = new Date(year, month + amount, 1);
    if (next < minViewMonth || next > maxViewMonth) return;
    setViewDate(next);
  }

  function isDateAllowed(date: Date) {
    const clean = new Date(date);
    clean.setHours(0, 0, 0, 0);
    return clean >= today && clean <= maxDate;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="tc-input flex items-center gap-3 text-left"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-[#8a7f85]" />
        <span className={value ? "text-[#201a1d]" : "text-[#91878c]"}>
          {displayDate()}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-[#8a7f85] transition ${
            open ? "rotate-180 text-[#A52E64]" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[280px] overflow-hidden rounded-[20px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-3 shadow-[0_24px_54px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.54)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                disabled={!canGoPrev}
                className="grid h-9 w-9 place-items-center rounded-[12px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] transition hover:bg-[#A52E64]/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-[12px] font-black capitalize tracking-[-0.02em] text-[#241f22]">
                {monthName}
              </span>

              <button
                type="button"
                onClick={() => moveMonth(1)}
                disabled={!canGoNext}
                className="grid h-9 w-9 place-items-center rounded-[12px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] transition hover:bg-[#A52E64]/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase text-[#81777b]">
              {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, index) => {
                const cellDate = day ? new Date(year, month, day) : null;
                const iso = cellDate ? formatDate(cellDate) : "";
                const isSelected = iso === value;
                const allowed = cellDate ? isDateAllowed(cellDate) : false;
                const isToday = cellDate ? formatDate(cellDate) === formatDate(today) : false;

                return (
                  <button
                    key={`${day ?? "empty"}-${index}`}
                    type="button"
                    disabled={!day || !allowed}
                    onClick={() => {
                      if (!cellDate || !allowed) return;
                      onChange(formatDate(cellDate));
                      setOpen(false);
                    }}
                    className={`grid h-9 place-items-center rounded-[11px] text-[12px] font-black transition active:scale-95 disabled:cursor-not-allowed ${
                      !day
                        ? "opacity-0"
                        : isSelected
                          ? "bg-[#A52E64] text-[#f7f2f4] shadow-[0_10px_20px_rgba(165,46,100,.24)]"
                          : allowed
                            ? isToday
                              ? "border border-[#A52E64]/35 bg-[#A52E64]/10 text-[#A52E64] hover:bg-[#A52E64]/15"
                              : "bg-[#e8e3e5] text-[#241f22] hover:bg-[#A52E64]/10 hover:text-[#A52E64]"
                            : "bg-[#d5cfd2] text-[#9a9095] opacity-45"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange("")}
                className="min-h-10 rounded-[13px] border border-[#b9b0b5] bg-[#ebe7e8] text-[12px] font-black text-[#756b70]"
              >
                Borrar
              </button>

              <button
                type="button"
                onClick={() => {
                  onChange(formatDate(today));
                  setViewDate(today);
                  setOpen(false);
                }}
                className="min-h-10 rounded-[13px] border border-[#A52E64]/25 bg-[#A52E64]/10 text-[12px] font-black text-[#A52E64]"
              >
                Hoy
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function EditActionsPanel({
  dirty,
  saved,
  canSave,
  canContinue,
  isSaving,
  isRouteLoading,
  onSave,
  onContinue,
}: {
  dirty: boolean;
  saved: boolean;
  canSave: boolean;
  canContinue: boolean;
  isSaving: boolean;
  isRouteLoading: boolean;
  onSave: () => void;
  onContinue: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-3 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)] sm:p-4"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="tc-primary-button flex min-h-12 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "Guardando" : dirty ? "Guardar cambios" : saved ? "Guardado" : "Guardar cambios"}
          <Save className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="min-h-12 rounded-[16px] border border-[#A52E64]/25 bg-[#A52E64]/10 px-4 text-[13px] font-black text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#A52E64]/15 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {isRouteLoading ? "Cargando productos" : "Continuar a productos"}
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </motion.section>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-[17px] border border-dashed border-[#c4bcc0] bg-[#e9e4e6] px-3 py-5 text-center text-[12px] font-bold text-[#756b70]">
      {text}
    </div>
  );
}

function normalizeMoneyNumber(value: string) {
  const clean = value.replace(/\D/g, "");
  if (!clean) return 0;
  return Number(clean);
}

function todayIso() {
  const now = new Date();
  return formatDateIso(now);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateIso(date);
}

function formatDateIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(value: string) {
  if (!value) return "Sin fecha";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}