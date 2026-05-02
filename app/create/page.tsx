"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Contact,
  FileText,
  Minus,
  Plus,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type ClientType = "contacto" | "empresa" | "";
type CreateStep = "datos" | "cliente" | "parametros";

type ClientRecord = {
  id: string;
  name: string;
  meta: string;
  ruc?: string;
  phone?: string;
  email?: string;
};

const limits = {
  nombreMax: 60,
  tiradasMax: 100000,
  hojasMax: 50,
  articulosMax: 150,
  columnasMax: 4,
};

const mockClients: Record<Exclude<ClientType, "">, ClientRecord[]> = {
  contacto: [
    {
      id: "C-1842",
      name: "María Fernández",
      meta: "CI 3.456.789 · Cliente frecuente",
      phone: "+595 981 000 121",
      email: "maria@cliente.com",
    },
    {
      id: "C-2149",
      name: "Carlos Benítez",
      meta: "CI 4.223.011 · Particular",
      phone: "+595 982 110 404",
      email: "carlos@cliente.com",
    },
  ],
  empresa: [
    {
      id: "E-0921",
      name: "Todo Costura S.A.",
      meta: "RUC 80012345-6 · Cuenta corporativa",
      ruc: "80012345-6",
      phone: "+595 21 000 000",
      email: "compras@todocostura.com",
    },
    {
      id: "E-1390",
      name: "Textiles del Sur",
      meta: "RUC 80111888-2 · Mayorista",
      ruc: "80111888-2",
      phone: "+595 21 222 100",
      email: "admin@textilessur.com",
    },
  ],
};

const stepOrder: CreateStep[] = ["datos", "cliente", "parametros"];

export default function CreatePage() {
  const [activeStep, setActiveStep] = useState<CreateStep>("datos");

  const [nombre, setNombre] = useState("");
  const [edicion, setEdicion] = useState("");
  const [fecha, setFecha] = useState("");
  const [precio, setPrecio] = useState("");

  const [clientType, setClientType] = useState<ClientType>("");
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);

  const [tiradas, setTiradas] = useState(1);
  const [hojas, setHojas] = useState(1);
  const [articulos, setArticulos] = useState(4);
  const [columnas, setColumnas] = useState(1);

  const canCreate = useMemo(() => {
    return nombre.trim().length > 0 && fecha.trim().length > 0;
  }, [nombre, fecha]);

  const progress = useMemo(() => {
    let completed = 0;

    if (nombre.trim()) completed += 1;
    if (fecha.trim()) completed += 1;
    if (clientType || selectedClient) completed += 1;
    if (tiradas && hojas && articulos && columnas) completed += 1;

    return Math.round((completed / 4) * 100);
  }, [articulos, clientType, columnas, fecha, hojas, nombre, selectedClient, tiradas]);

  const filteredClients = useMemo(() => {
    if (!clientType) return [];

    const query = clientQuery.trim().toLowerCase();

    if (!query) return mockClients[clientType].slice(0, 2);

    return mockClients[clientType].filter((client) => {
      return `${client.name} ${client.meta} ${client.id}`.toLowerCase().includes(query);
    });
  }, [clientQuery, clientType]);

  function normalizeMoney(value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 9);
    if (!clean) return "";
    return Number(clean).toLocaleString("es-PY");
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

  function selectClient(client: ClientRecord) {
    setSelectedClient(client);
    setClientQuery(client.name);
  }

  function goNext() {
    const index = stepOrder.indexOf(activeStep);
    const next = stepOrder[index + 1];

    if (next) setActiveStep(next);
  }

  function goBack() {
    const index = stepOrder.indexOf(activeStep);
    const prev = stepOrder[index - 1];

    if (prev) setActiveStep(prev);
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
                  Completá cada sección del flujo para preparar la revista antes de añadir productos.
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

          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-h-[360px]">
              <AnimatePresence mode="wait">
                {activeStep === "datos" ? (
                  <motion.div
                    key="datos"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
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
                              setNombre(event.target.value.slice(0, limits.nombreMax))
                            }
                            maxLength={limits.nombreMax}
                            placeholder="Ej: Catálogo Primavera 2025"
                            className="tc-input text-[15px] font-black tracking-[-0.02em]"
                          />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Edición">
                            <input
                              value={edicion}
                              onChange={(event) => setEdicion(event.target.value)}
                              placeholder="Nov 2024 – Ago 2025"
                              className="tc-input"
                            />
                          </Field>

                          <Field label="Fecha publicación">
                            <div className="relative">
                              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f85]" />
                              <input
                                value={fecha}
                                onChange={(event) => setFecha(event.target.value)}
                                type="date"
                                className="tc-input pl-9"
                              />
                            </div>
                          </Field>
                        </div>

                        <Field label="Precio revista / opcional">
                          <input
                            value={precio}
                            onChange={(event) => setPrecio(normalizeMoney(event.target.value))}
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
                  </motion.div>
                ) : null}

                {activeStep === "cliente" ? (
                  <motion.div
                    key="cliente"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
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
                                    onClick={() => selectClient(client)}
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
                                  Sin resultados de ejemplo. Luego se conecta al endpoint real.
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
                                  onClick={() => {
                                    setSelectedClient(null);
                                    setClientQuery("");
                                  }}
                                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#756b70] transition hover:bg-[#A52E64]/10 hover:text-[#A52E64] active:scale-95"
                                  aria-label="Quitar cliente"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>

                        <StepControls
                          activeStep={activeStep}
                          onBack={goBack}
                          onNext={goNext}
                        />
                      </div>
                    </FormCard>
                  </motion.div>
                ) : null}

                {activeStep === "parametros" ? (
                  <motion.div
                    key="parametros"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
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
                            updateNumber(setTiradas, value, 1, limits.tiradasMax)
                          }
                        />
                        <NumberControl
                          label="Máx. hojas"
                          value={hojas}
                          min={1}
                          max={limits.hojasMax}
                          onChange={(value) => updateNumber(setHojas, value, 1, limits.hojasMax)}
                        />
                        <NumberControl
                          label="Máx. artículos"
                          value={articulos}
                          min={1}
                          max={limits.articulosMax}
                          onChange={(value) =>
                            updateNumber(setArticulos, value, 1, limits.articulosMax)
                          }
                        />
                        <NumberControl
                          label="Columnas por hoja"
                          value={columnas}
                          min={1}
                          max={limits.columnasMax}
                          onChange={(value) =>
                            updateNumber(setColumnas, value, 1, limits.columnasMax)
                          }
                        />
                      </div>

                      <StepControls
                        activeStep={activeStep}
                        onBack={goBack}
                        onNext={goNext}
                      />
                    </FormCard>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <SummaryPanel
              nombre={nombre}
              fecha={fecha}
              clientType={clientType}
              selectedClient={selectedClient}
              tiradas={tiradas}
              progress={progress}
              canCreate={canCreate}
            />
          </section>

          <MobileFooter canCreate={canCreate} progress={progress} />
        </motion.section>
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
            Gestiona la creación del catálogo desde una interfaz clara y controlada.
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
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  number: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[17px] px-3 py-3 text-left transition active:scale-[0.985] ${
        active
          ? "bg-[#242225] text-[#f4f1f3] shadow-[0_14px_30px_rgba(0,0,0,.22)]"
          : "text-[#332d31] hover:bg-[#e4dfe1]"
      }`}
    >
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border ${
          active
            ? "border-[#A52E64]/35 bg-[#A52E64]"
            : "border-[#bdb5b9] bg-[#e7e2e4] text-[#A52E64]"
        } [&_svg]:h-4 [&_svg]:w-4`}
      >
        {icon}
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
    </button>
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
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
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
              <span className="text-[10px] font-black text-[#8a8085]">{badge}</span>
            ) : null}
          </div>

          <h3 className="text-[24px] font-black leading-none tracking-[-0.06em] text-[#241f22]">
            {title}
          </h3>
          <p className="mt-2 text-[12px] font-bold text-[#655c61]">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
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
  const isLast = activeStep === "parametros";

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
        disabled={isLast}
        className="min-h-11 rounded-[16px] border border-[#A52E64]/25 bg-[#A52E64]/10 px-4 text-[13px] font-black text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#A52E64]/15 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] border px-3 text-[12.5px] font-black transition active:scale-[0.985] ${
        active
          ? "border-[#A52E64] bg-[#A52E64]/10 text-[#A52E64] shadow-[0_0_0_4px_rgba(165,46,100,.10),inset_0_1px_0_rgba(255,255,255,.36)]"
          : "border-[#b9b0b5] bg-[linear-gradient(180deg,#eee9eb,#dfdadd)] text-[#62595d] shadow-[inset_0_1px_0_rgba(255,255,255,.46)] hover:border-[#A52E64]/40 hover:bg-[#e8e3e5]"
      }`}
    >
      <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      {children}
    </button>
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
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SummaryPanel({
  nombre,
  fecha,
  clientType,
  selectedClient,
  tiradas,
  progress,
  canCreate,
}: {
  nombre: string;
  fecha: string;
  clientType: ClientType;
  selectedClient: ClientRecord | null;
  tiradas: number;
  progress: number;
  canCreate: boolean;
}) {
  return (
    <aside className="lg:sticky lg:top-6">
      <section className="rounded-[22px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-4 shadow-[0_14px_34px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.54)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <span className="rounded-full bg-[#A52E64] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#f7f2f4]">
              Resumen
            </span>
            <h3 className="mt-3 text-[24px] font-black leading-none tracking-[-0.06em] text-[#241f22]">
              Datos de creación
            </h3>
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-full bg-[#c8c1c5] shadow-[inset_0_1px_2px_rgba(0,0,0,.14)]">
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="h-2 rounded-full bg-[linear-gradient(90deg,#621638,#A52E64,#c45b8b)]"
          />
        </div>

        <div className="grid gap-2">
          <SummaryRow label="Revista" value={nombre || "Sin nombre"} />
          <SummaryRow label="Fecha" value={fecha || "Pendiente"} />
          <SummaryRow label="Cliente" value={selectedClient?.name || clientType || "No asignado"} />
          <SummaryRow label="Tiradas" value={String(tiradas)} />
        </div>

        <div className="mt-5 grid gap-2">
          <button
            disabled={!canCreate}
            className="tc-primary-button disabled:cursor-not-allowed disabled:opacity-40"
          >
            Crear revista
          </button>

          <button
            disabled
            className="min-h-11 rounded-[16px] border border-[#b9b0b5] bg-[#ebe7e8] px-4 text-[13px] font-black text-[#81777b] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Añadir productos
          </button>
        </div>

        {!canCreate ? (
          <div className="mt-4 flex gap-2 rounded-[15px] border border-[#c7bfc3] bg-[#e9e4e6] p-3 text-[11px] font-bold leading-relaxed text-[#756b70]">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#A52E64]" />
            Nombre y fecha son obligatorios para crear la revista.
          </div>
        ) : null}
      </section>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-black/5 bg-[#ebe7e8]/70 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.32)]">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#81777b]">
        {label}
      </span>
      <span className="max-w-[180px] truncate text-right text-[12px] font-black text-[#241f22]">
        {value}
      </span>
    </div>
  );
}

function MobileFooter({ canCreate, progress }: { canCreate: boolean; progress: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[linear-gradient(to_top,rgba(16,16,17,.98)_70%,rgba(16,16,17,.78)_88%,transparent)] px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-5 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-[440px] gap-2">
        <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/46">
          <span>Progreso</span>
          <span className="text-[#f4f1f3]">{progress}%</span>
        </div>

        <button
          disabled={!canCreate}
          className="tc-primary-button disabled:cursor-not-allowed disabled:opacity-40"
        >
          Crear revista
        </button>

        <button
          disabled
          className="min-h-11 rounded-[16px] border border-white/20 bg-[#ded9db] px-4 text-[13px] font-black text-[#756b70] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] disabled:cursor-not-allowed disabled:opacity-65"
        >
          Añadir productos
        </button>
      </div>
    </div>
  );
}