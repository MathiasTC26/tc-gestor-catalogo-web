"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RouteTransitionOverlay } from "@/app/_components/route-transition-overlay";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Contact,
  FileText,
  Loader2,
  Minus,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";

type ClientType = "contacto" | "empresa" | "";
type CreateStep = "datos" | "cliente" | "parametros";

type ClientRecord = {
  id: string;
  name: string;
  meta: string;
  phone?: string;
  email?: string;
  ruc?: string;
};

const limits = {
  nombreMax: 60,
  tiradasMax: 100000,
  hojasMax: 50,
  articulosMax: 150,
  columnasMax: 4,
};
const stepOrder: CreateStep[] = ["datos", "cliente", "parametros"];

const clientCatalog: Record<Exclude<ClientType, "">, ClientRecord[]> = {
  contacto: [],
  empresa: [],
};

export default function CreatePage() {
  const [activeStep, setActiveStep] = useState<CreateStep>("datos");
  const [nombre, setNombre] = useState("");
  const [edicion, setEdicion] = useState("");
  const [fecha, setFecha] = useState("");
  const [precio, setPrecio] = useState("");
  const [clientType, setClientType] = useState<ClientType>("");
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(
    null,
  );
  const [tiradas, setTiradas] = useState(1);
  const [hojas, setHojas] = useState(1);
  const [articulos, setArticulos] = useState(1);
  const [columnas, setColumnas] = useState(1);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const saveLockRef = useRef(false);
  const routeLockRef = useRef(false);
  const router = useRouter();

  const canCreate = useMemo(
    () =>
      nombre.trim().length > 0 &&
      fecha.trim().length > 0 &&
      Boolean(clientType || selectedClient),
    [clientType, fecha, nombre, selectedClient],
  );
  const progress = useMemo(() => {
    let completed = 0;
    if (nombre.trim()) completed += 1;
    if (fecha.trim()) completed += 1;
    if (clientType || selectedClient) completed += 1;
    if (tiradas && hojas && articulos && columnas) completed += 1;
    return Math.round((completed / 4) * 100);
  }, [
    articulos,
    clientType,
    columnas,
    fecha,
    hojas,
    nombre,
    selectedClient,
    tiradas,
  ]);

  const filteredClients = useMemo(() => {
    if (!clientType) return [];
    const query = clientQuery.trim().toLowerCase();
    if (!query) return [];
    return clientCatalog[clientType].filter((client) =>
      `${client.name} ${client.meta} ${client.id}`
        .toLowerCase()
        .includes(query),
    );
  }, [clientQuery, clientType]);

  function normalizeMoney(value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 9);
    return clean ? Number(clean).toLocaleString("es-PY") : "";
  }

  function updateNumber(
    setter: (value: number) => void,
    value: number,
    min: number,
    max: number,
  ) {
    setter(Math.min(max, Math.max(min, value)));
  }

  function selectClientType(type: Exclude<ClientType, "">) {
    setClientType(type);
    setSelectedClient(null);
    setClientQuery("");
  }

  function goNext() {
    const next = stepOrder[stepOrder.indexOf(activeStep) + 1];
    if (next) setActiveStep(next);
  }

  function goBack() {
    const prev = stepOrder[stepOrder.indexOf(activeStep) - 1];
    if (prev) setActiveStep(prev);
  }

  function persistMagazineMeta() {
    sessionStorage.setItem(
      "revista_preview_meta",
      JSON.stringify({
        number: 128,
        title: nombre.trim() || "Revista sin nombre",
        client: selectedClient?.name ?? clientQuery.trim() ?? "Cliente no definido",
        maxSheets: hojas,
        maxColumns: columnas,
        maxArticles: articulos,
      }),
    );
  }

  function handleSaveMagazine() {
    if (!canCreate || saveStatus === "saving" || isRouteLoading) return;

    if (saveStatus === "saved") {
      if (routeLockRef.current) return;

      persistMagazineMeta();
      routeLockRef.current = true;
      setIsRouteLoading(true);
      window.setTimeout(() => {
        router.push("/products");
      }, 850);
      return;
    }

    if (saveLockRef.current) return;

    saveLockRef.current = true;
    setSaveStatus("saving");
    window.setTimeout(() => {
      persistMagazineMeta();
      setSaveStatus("saved");
    }, 1200);
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
          <ModuleRail activeStep={activeStep} onStepChange={setActiveStep} />
          <HeroIntro />

          <section className="mt-4 grid gap-4">
            <div className="min-h-[360px]">
              <AnimatePresence mode="wait">
                {activeStep === "datos" ? (
                  <StepMotion key="datos">
                    <FormCard
                      eyebrow="Paso 1"
                      title="Identificación"
                      subtitle="Nombre, edición y fecha de publicación"
                      icon={<FileText />}
                      badge={`${nombre.length} / ${limits.nombreMax}`}
                    >
                      <div className="grid gap-3">
                        <Field label="Nombre de revista">
                          <input
                            value={nombre}
                            onChange={(event) =>
                              setNombre(
                                event.target.value.slice(0, limits.nombreMax),
                              )
                            }
                            maxLength={limits.nombreMax}
                            placeholder="Nombre de la revista"
                            className="tc-input text-[15px] font-black tracking-[-0.02em]"
                          />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Edición">
                            <input
                              value={edicion}
                              onChange={(event) =>
                                setEdicion(event.target.value)
                              }
                              placeholder="Edición"
                              className="tc-input"
                            />
                          </Field>
                          <Field label="Fecha publicación">
                            <DatePicker value={fecha} onChange={setFecha} />
                          </Field>
                        </div>
                        <Field label="Precio revista / opcional">
                          <input
                            value={precio}
                            onChange={(event) =>
                              setPrecio(normalizeMoney(event.target.value))
                            }
                            inputMode="numeric"
                            placeholder="Máximo: 999.999.999"
                            className="tc-input"
                          />
                        </Field>
                        <StepControls
                          activeStep={activeStep}
                          onBack={goBack}
                          onNext={goNext}
                        />
                      </div>
                    </FormCard>
                  </StepMotion>
                ) : null}

                {activeStep === "cliente" ? (
                  <StepMotion key="cliente">
                    <FormCard
                      eyebrow="Paso 2"
                      title="Cliente"
                      subtitle="Contacto o empresa asociada"
                      icon={<Contact />}
                    >
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <ChoiceButton
                            active={clientType === "contacto"}
                            onClick={() => selectClientType("contacto")}
                            icon={<Contact />}
                          >
                            Contacto
                          </ChoiceButton>
                          <ChoiceButton
                            active={clientType === "empresa"}
                            onClick={() => selectClientType("empresa")}
                            icon={<Building2 />}
                          >
                            Empresa
                          </ChoiceButton>
                        </div>
                        <Field label="Buscar cliente">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f85]" />
                            <input
                              disabled={!clientType}
                              value={clientQuery}
                              onChange={(event) => {
                                setClientQuery(event.target.value);
                                setSelectedClient(null);
                              }}
                              placeholder={
                                clientType === "contacto"
                                  ? "Nombre o CI exacta..."
                                  : clientType === "empresa"
                                    ? "Nombre de empresa o RUC..."
                                    : "Seleccioná primero el tipo"
                              }
                              className="tc-input pl-9 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        </Field>
                        <ClientResults
                          clientType={clientType}
                          selectedClient={selectedClient}
                          filteredClients={filteredClients}
                          onSelect={(client) => {
                            setSelectedClient(client);
                            setClientQuery(client.name);
                          }}
                          onClear={() => {
                            setSelectedClient(null);
                            setClientQuery("");
                          }}
                        />
                        <StepControls
                          activeStep={activeStep}
                          onBack={goBack}
                          onNext={goNext}
                        />
                      </div>
                    </FormCard>
                  </StepMotion>
                ) : null}

                {activeStep === "parametros" ? (
                  <StepMotion key="parametros">
                    <FormCard
                      eyebrow="Paso 3"
                      title="Parámetros editoriales"
                      subtitle="Tiradas, hojas, artículos y columnas"
                      icon={<Settings2 />}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <NumberControl
                          label="Tiradas"
                          value={tiradas}
                          min={1}
                          max={limits.tiradasMax}
                          onChange={(value) =>
                            updateNumber(
                              setTiradas,
                              value,
                              1,
                              limits.tiradasMax,
                            )
                          }
                        />
                        <NumberControl
                          label="Máx. hojas"
                          value={hojas}
                          min={1}
                          max={limits.hojasMax}
                          onChange={(value) =>
                            updateNumber(setHojas, value, 1, limits.hojasMax)
                          }
                        />
                        <NumberControl
                          label="Máx. artículos"
                          value={articulos}
                          min={1}
                          max={limits.articulosMax}
                          onChange={(value) =>
                            updateNumber(
                              setArticulos,
                              value,
                              1,
                              limits.articulosMax,
                            )
                          }
                        />
                        <NumberControl
                          label="Columnas por hoja"
                          value={columnas}
                          min={1}
                          max={limits.columnasMax}
                          onChange={(value) =>
                            updateNumber(
                              setColumnas,
                              value,
                              1,
                              limits.columnasMax,
                            )
                          }
                        />
                      </div>
                    </FormCard>
                  </StepMotion>
                ) : null}
              </AnimatePresence>

              {activeStep === "parametros" ? (
                <SaveMagazineAction
                  canCreate={canCreate}
                  saveStatus={saveStatus}
                  onBack={goBack}
                  onSave={handleSaveMagazine}
                />
              ) : null}
            </div>
          </section>
        </motion.section>

        <RouteTransitionOverlay
          show={isRouteLoading}
          title="Cargando productos"
          description="Preparando la sección de artículos..."
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
            Crear revista
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#f4f1f3]/68 sm:text-[15px]">
            Gestiona la creación del catálogo desde una interfaz clara y
            controlada.
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

function ModuleRail({
  activeStep,
  onStepChange,
}: {
  activeStep: CreateStep;
  onStepChange: (step: CreateStep) => void;
}) {
  return (
    <nav className="mt-4 grid gap-2 rounded-[21px] border border-[#bdb5b9] bg-[#d8d3d5] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.55)] md:grid-cols-3">
      <RailItem
        active={activeStep === "datos"}
        icon={<FileText />}
        title="Datos"
        subtitle="Principal"
        number="01"
        onClick={() => onStepChange("datos")}
      />
      <RailItem
        active={activeStep === "cliente"}
        icon={<Contact />}
        title="Cliente"
        subtitle="Asociación"
        number="02"
        onClick={() => onStepChange("cliente")}
      />
      <RailItem
        active={activeStep === "parametros"}
        icon={<Settings2 />}
        title="Parámetros"
        subtitle="Editorial"
        number="03"
        onClick={() => onStepChange("parametros")}
      />
    </nav>
  );
}

function RailItem({
  active,
  icon,
  title,
  subtitle,
  number,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  number: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[17px] px-3 py-3 text-left transition active:scale-[0.985] ${active ? "bg-[#242225] text-[#f4f1f3] shadow-[0_14px_30px_rgba(0,0,0,.22)]" : "text-[#332d31] hover:bg-[#e4dfe1]"}`}
    >
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border ${active ? "border-[#A52E64]/35 bg-[#A52E64]" : "border-[#bdb5b9] bg-[#e7e2e4] text-[#A52E64]"} [&_svg]:h-4 [&_svg]:w-4`}
      >
        {icon}
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
    </button>
  );
}

function HeroIntro() {
  return (
    <section className="mt-4 rounded-[25px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#e9e4e6,#ded9db)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.52)] sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A52E64]">
            Creación
          </p>
          <h1 className="mt-1 text-[32px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22] sm:text-[44px]">
            Nueva revista
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#655c61]">
            Completá cada sección del flujo para preparar la revista antes de
            añadir productos.
          </p>
        </div>
        <div className="rounded-[18px] border border-[#bdb5b9] bg-[#e5e0e2] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
          <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[#81777c]">
            Edición
          </span>
          <span className="mt-1 block text-[22px] font-black leading-none tracking-[-0.05em] text-[#A52E64]">
            #128
          </span>
        </div>
      </div>
    </section>
  );
}

function StepMotion({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function FormCard({
  eyebrow,
  title,
  subtitle,
  icon,
  badge,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-4 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)]">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.55)] [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#A52E64] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#f7f2f4]">
              {eyebrow}
            </span>
            {badge ? (
              <span className="text-[10px] font-black text-[#8a8085]">
                {badge}
              </span>
            ) : null}
          </div>
          <h3 className="text-[24px] font-black leading-none tracking-[-0.06em] text-[#241f22]">
            {title}
          </h3>
          <p className="mt-2 text-[12px] font-bold text-[#655c61]">
            {subtitle}
          </p>
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
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] border px-3 text-[12.5px] font-black transition active:scale-[0.985] ${active ? "border-[#A52E64] bg-[#A52E64]/10 text-[#A52E64] shadow-[0_0_0_4px_rgba(165,46,100,.10),inset_0_1px_0_rgba(255,255,255,.36)]" : "border-[#b9b0b5] bg-[linear-gradient(180deg,#eee9eb,#dfdadd)] text-[#62595d] shadow-[inset_0_1px_0_rgba(255,255,255,.46)] hover:border-[#A52E64]/40 hover:bg-[#e8e3e5]"}`}
    >
      <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      {children}
    </button>
  );
}

function ClientResults({
  clientType,
  selectedClient,
  filteredClients,
  onSelect,
  onClear,
}: {
  clientType: ClientType;
  selectedClient: ClientRecord | null;
  filteredClients: ClientRecord[];
  onSelect: (client: ClientRecord) => void;
  onClear: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {clientType && !selectedClient ? (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="grid gap-2"
        >
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <button
                type="button"
                key={client.id}
                onClick={() => onSelect(client)}
                className="group flex min-h-[58px] items-center gap-3 rounded-[17px] border border-[#c4bcc0] bg-[#e9e4e6] px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition hover:-translate-y-0.5 hover:border-[#A52E64]/45 hover:bg-[#eee9eb] active:scale-[0.99]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#A52E64]/10 text-[11px] font-black text-[#A52E64] ring-1 ring-[#A52E64]/10">
                  {client.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-black text-[#241f22]">
                    {client.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-[#756b70]">
                    {client.meta}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#A52E64] opacity-60 transition group-hover:translate-x-0.5" />
              </button>
            ))
          ) : (
            <div className="rounded-[17px] border border-[#c4bcc0] bg-[#e9e4e6] px-3 py-3 text-[12px] font-bold text-[#756b70]">
              Sin resultados. La búsqueda se conectará al endpoint real.
            </div>
          )}
        </motion.div>
      ) : null}
      {selectedClient ? (
        <motion.div
          key="selected"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-[18px] border border-[#A52E64]/25 bg-[#A52E64]/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[linear-gradient(135deg,#761d46,#A52E64)] text-[#f7f2f4] shadow-[0_10px_22px_rgba(165,46,100,.24)]">
              <Check className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-black text-[#241f22]">
                {selectedClient.name}
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#62595d]">
                {selectedClient.meta}
              </p>
              <div className="mt-3 grid gap-1.5 text-[10.5px] font-bold text-[#756b70]">
                {selectedClient.phone ? (
                  <span>Tel: {selectedClient.phone}</span>
                ) : null}
                {selectedClient.email ? (
                  <span>Email: {selectedClient.email}</span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#756b70] transition hover:bg-[#A52E64]/10 hover:text-[#A52E64] active:scale-95"
              aria-label="Quitar cliente"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
          <Minus className="h-4 w-4" />
        </button>
        <input
          value={value}
          onChange={(event) =>
            onChange(Number(event.target.value.replace(/\D/g, "")) || min)
          }
          inputMode="numeric"
          className="min-w-0 border-x border-[#c4bcc0] bg-transparent text-center text-[14px] font-black text-[#201a1d] outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="grid place-items-center text-[#A52E64] transition hover:bg-[#A52E64]/10 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StepControls({
  activeStep,
  onBack,
  onNext,
}: {
  activeStep: CreateStep;
  onBack: () => void;
  onNext: () => void;
}) {
  const isFirst = activeStep === "datos";
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="min-h-11 rounded-[16px] border border-[#b9b0b5] bg-[#ebe7e8] px-4 text-[13px] font-black text-[#756b70] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#e4dfe1] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Volver
      </button>
      <button
        type="button"
        onClick={onNext}
        className="min-h-11 rounded-[16px] border border-[#A52E64]/25 bg-[#A52E64]/10 px-4 text-[13px] font-black text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#A52E64]/15 active:scale-[0.985]"
      >
        Siguiente
      </button>
    </div>
  );
}

function SaveMagazineAction({
  canCreate,
  saveStatus,
  onBack,
  onSave,
}: {
  canCreate: boolean;
  saveStatus: "idle" | "saving" | "saved";
  onBack: () => void;
  onSave: () => void;
}) {
  const isSaving = saveStatus === "saving";
  const isSaved = saveStatus === "saved";
  const label = isSaved ? "Agregar productos" : "Guardar revista";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 rounded-[24px] border border-[#c5bcc1] bg-[linear-gradient(145deg,#e7e2e4,#d6d1d3)] p-3 shadow-[0_18px_44px_rgba(0,0,0,.16),inset_0_1px_0_rgba(255,255,255,.62)]"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="min-h-12 rounded-[17px] border border-[#b9b0b5] bg-[#ebe7e8] px-4 text-[13px] font-black text-[#756b70] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#e4dfe1] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Volver
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!canCreate || isSaving}
            className={`group relative min-h-12 overflow-hidden rounded-[17px] border px-4 text-[13px] font-black shadow-[inset_0_1px_0_rgba(255,255,255,.25)] transition active:scale-[0.985] disabled:cursor-not-allowed ${canCreate || isSaved ? "border-[#A52E64]/35 bg-[linear-gradient(135deg,#84204f,#A52E64)] text-[#f7f2f4] shadow-[0_16px_34px_rgba(165,46,100,.26)] hover:brightness-105" : "border-[#cdb7c1] bg-[#d9cbd1] text-[#9a7c8a] opacity-60"}`}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.24),transparent)] transition duration-700 group-hover:translate-x-full" />
            <span className="relative inline-flex items-center justify-center gap-2">
              {isSaved ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {label}
            </span>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isSaving ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[90] grid place-items-center bg-[#101011]/72 px-4 backdrop-blur-[6px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[360px] rounded-[28px] border border-white/45 bg-[linear-gradient(145deg,#ece7e9,#d9d3d6)] p-6 text-center shadow-[0_34px_90px_rgba(0,0,0,.46),inset_0_1px_0_rgba(255,255,255,.72)]"
            >
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-[#A52E64]/25 bg-[#A52E64]/10 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
                <Loader2 className="h-7 w-7 animate-spin text-[#A52E64]" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A52E64]">
                Procesando
              </p>
              <h3 className="mt-2 text-[22px] font-black tracking-[-0.05em] text-[#241f22]">
                Guardando revista
              </h3>
              <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#766d72]">
                Preparando la revista antes de añadir productos.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const baseToday = new Date();
  baseToday.setHours(0, 0, 0, 0);
  const maxDate = new Date(baseToday);
  maxDate.setMonth(maxDate.getMonth() + 13);
  maxDate.setHours(0, 0, 0, 0);
  const selected = value ? new Date(`${value}T00:00:00`) : null;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selected ?? baseToday);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const minViewMonth = new Date(
    baseToday.getFullYear(),
    baseToday.getMonth(),
    1,
  );
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
    return clean >= baseToday && clean <= maxDate;
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
                ←
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
                →
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
                const isToday = cellDate
                  ? formatDate(cellDate) === formatDate(baseToday)
                  : false;
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
                    className={`grid h-9 place-items-center rounded-[11px] text-[12px] font-black transition active:scale-95 disabled:cursor-not-allowed ${!day ? "opacity-0" : isSelected ? "bg-[#A52E64] text-[#f7f2f4] shadow-[0_10px_20px_rgba(165,46,100,.24)]" : allowed ? (isToday ? "border border-[#A52E64]/35 bg-[#A52E64]/10 text-[#A52E64] hover:bg-[#A52E64]/15" : "bg-[#e8e3e5] text-[#241f22] hover:bg-[#A52E64]/10 hover:text-[#A52E64]") : "bg-[#d5cfd2] text-[#9a9095] opacity-45"}`}
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
                  onChange(formatDate(baseToday));
                  setViewDate(baseToday);
                  setOpen(false);
                }}
                className="min-h-10 rounded-[13px] border border-[#A52E64]/25 bg-[#A52E64]/10 text-[12px] font-black text-[#A52E64]"
              >
                Hoy
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] font-bold leading-relaxed text-[#81777b]">
              Solo se permite seleccionar desde hoy hasta 13 meses adelante.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
