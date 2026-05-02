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

const cardMotion = {
  initial: { opacity: 0, y: 14, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

export default function CreatePage() {
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
    max: number
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

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden bg-[#111113] px-3 py-3 text-[#1f191c] sm:px-5 sm:py-5 lg:px-6">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(255,255,255,0.06),transparent_30%),linear-gradient(180deg,#111113_0%,#171619_55%,#101012_100%)]" />
        <div className="pointer-events-none fixed inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />

        <motion.section
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto grid w-full max-w-[1120px] gap-4 pb-[132px] lg:grid-cols-[minmax(0,1fr)_348px] lg:pb-6"
        >
          <section className="space-y-3">
            <StepsRail progress={progress} />

            <HeroCard nextNro={128} />

            <div className="grid gap-3">
              <FormCard
                delay={0.03}
                icon={<FileText aria-hidden="true" />}
                eyebrow="Paso 1"
                title="Identificación"
                subtitle="Nombre, edición y fecha de publicación"
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
                </div>
              </FormCard>

              <FormCard
                delay={0.07}
                icon={<Contact aria-hidden="true" />}
                eyebrow="Paso 2"
                title="Cliente"
                subtitle="Contacto o empresa asociada"
              >
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      active={clientType === "contacto"}
                      onClick={() => selectClientType("contacto")}
                      icon={<Contact aria-hidden="true" />}
                    >
                      Contacto
                    </ChoiceButton>

                    <ChoiceButton
                      active={clientType === "empresa"}
                      onClick={() => selectClientType("empresa")}
                      icon={<Building2 aria-hidden="true" />}
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
                              className="group flex min-h-[58px] items-center gap-3 rounded-[15px] border border-[#c7bfc3] bg-[#e9e4e6] px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition hover:-translate-y-0.5 hover:border-[#A52E64]/45 hover:bg-[#eee9eb] active:scale-[0.99]"
                            >
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#A52E64]/10 text-[11px] font-black text-[#A52E64] ring-1 ring-[#A52E64]/10">
                                {client.name
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((word) => word[0])
                                  .join("")}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-black text-[#201a1d]">
                                  {client.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-[#7b7277]">
                                  {client.meta}
                                </span>
                              </span>

                              <ChevronRight className="h-4 w-4 shrink-0 text-[#A52E64] opacity-60 transition group-hover:translate-x-0.5" />
                            </button>
                          ))
                        ) : (
                          <div className="rounded-[15px] border border-[#c7bfc3] bg-[#e9e4e6] px-3 py-3 text-[12px] font-bold text-[#7b7277]">
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
                        className="rounded-[16px] border border-[#A52E64]/25 bg-[#A52E64]/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[linear-gradient(135deg,#761d46,#A52E64)] text-[11px] font-black text-[#f7f2f4] shadow-[0_10px_22px_rgba(165,46,100,.24)]">
                            <Check className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-black text-[#201a1d]">
                              {selectedClient.name}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#62595d]">
                              {selectedClient.meta}
                            </p>
                            <div className="mt-3 grid gap-1.5 text-[10.5px] font-bold text-[#7b7277]">
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
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#7b7277] transition hover:bg-[#A52E64]/10 hover:text-[#A52E64] active:scale-95"
                            aria-label="Quitar cliente"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </FormCard>

              <FormCard
                delay={0.11}
                icon={<Settings2 aria-hidden="true" />}
                eyebrow="Paso 3"
                title="Parámetros editoriales"
                subtitle="Tiradas, hojas, artículos y columnas"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberControl
                    label="Tiradas"
                    value={tiradas}
                    min={1}
                    max={limits.tiradasMax}
                    onChange={(value) => updateNumber(setTiradas, value, 1, limits.tiradasMax)}
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
              </FormCard>
            </div>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <SummaryPanel
              nombre={nombre}
              fecha={fecha}
              clientType={clientType}
              selectedClient={selectedClient}
              tiradas={tiradas}
              progress={progress}
              canCreate={canCreate}
            />
          </aside>
        </motion.section>

        <MobileActionBar canCreate={canCreate} progress={progress} />
      </main>
    </MotionConfig>
  );
}

function StepsRail({ progress }: { progress: number }) {
  return (
    <section className="rounded-full border border-white/10 bg-white/[0.045] p-1.5 shadow-[0_18px_42px_rgba(0,0,0,.22)] backdrop-blur-md">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <Step active label="Datos" number="1" />
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="h-full rounded-full bg-[linear-gradient(90deg,#621638,#A52E64,#c45b8b)] shadow-[0_0_18px_rgba(165,46,100,.42)]"
          />
        </div>
        <Step active={progress >= 100} label="Productos" number="2" />
      </div>
    </section>
  );
}

function Step({ active, label, number }: { active: boolean; label: string; number: string }) {
  return (
    <div className="flex items-center gap-2 px-1.5">
      <span
        className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-black transition ${
          active
            ? "bg-[linear-gradient(135deg,#761d46,#A52E64)] text-[#f7f2f4] shadow-[0_8px_18px_rgba(165,46,100,.34)]"
            : "bg-white/10 text-white/45"
        }`}
      >
        {number}
      </span>
      <span
        className={`text-[10.5px] font-black ${
          active ? "text-[#eee9eb]" : "text-white/42"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function HeroCard({ nextNro }: { nextNro: number }) {
  return (
    <motion.header
      {...cardMotion}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="tc-sheen relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.18),rgba(255,255,255,.035)_42%,rgba(0,0,0,.22)),linear-gradient(145deg,#33292e_0%,#201b1f_48%,#151315_100%)] p-4 shadow-[0_28px_70px_rgba(0,0,0,.42),inset_0_1px_0_rgba(255,255,255,.16)] sm:p-5"
    >
      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#A52E64]/30 bg-[#A52E64]/15 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A52E64] shadow-[0_0_14px_rgba(165,46,100,.72)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#f4f0f2]/90">
              Nueva revista
            </span>
          </div>

          <div className="rounded-[13px] border border-white/15 bg-white/[0.07] px-3 py-2 text-right">
            <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-[#f4f0f2]/50">
              Edición
            </span>
            <span className="block text-[18px] font-black leading-none tracking-[-0.05em] text-[#f7f2f4]">
              #{nextNro}
            </span>
          </div>
        </div>

        <h1 className="text-[21px] font-black leading-[1.05] tracking-[-0.055em] text-[#f4f0f2] sm:text-[25px]">
          Configuración editorial
        </h1>
        <p className="mt-2 max-w-xl text-[12.5px] font-medium leading-relaxed text-[#f4f0f2]/62 sm:text-[13px]">
          Completá los datos, creá la revista y luego agregá los productos.
        </p>
      </div>
    </motion.header>
  );
}

function FormCard({
  delay,
  icon,
  eyebrow,
  title,
  subtitle,
  badge,
  children,
}: {
  delay: number;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      {...cardMotion}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[22px] border border-white/35 bg-[linear-gradient(145deg,rgba(255,255,255,.35),rgba(255,255,255,.08)_38%,rgba(0,0,0,.06)),linear-gradient(180deg,#ebe7e8_0%,#ded9db_100%)] shadow-[0_22px_54px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.54)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_62px_rgba(0,0,0,.26),inset_0_1px_0_rgba(255,255,255,.56)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,.22),transparent)]" />

      <div className="relative z-10 flex items-center gap-3 border-b border-[#5c5258]/15 px-3.5 py-3">
        <div className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[11px] bg-[linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,0)),linear-gradient(135deg,#751c45,#A52E64)] text-[#f7f2f4] shadow-[0_10px_22px_rgba(165,46,100,.25),inset_0_1px_0_rgba(255,255,255,.20)] [&_svg]:h-[15px] [&_svg]:w-[15px]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#A52E64]">
            {eyebrow}
          </p>
          <h2 className="truncate text-[13px] font-black tracking-[-0.025em] text-[#201a1d]">
            {title}
          </h2>
          <p className="mt-0.5 truncate text-[10.5px] font-semibold text-[#7a7075]">
            {subtitle}
          </p>
        </div>

        {badge ? (
          <span className="shrink-0 rounded-full bg-[#A52E64]/10 px-2.5 py-1 text-[10.5px] font-black text-[#A52E64]">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="relative z-10 p-3.5 sm:p-4">{children}</div>
    </motion.section>
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
          aria-label={`Disminuir ${label}`}
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
          aria-label={`Aumentar ${label}`}
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
    <motion.section
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="hidden rounded-[24px] border border-white/35 bg-[linear-gradient(145deg,rgba(255,255,255,.35),rgba(255,255,255,.08)_38%,rgba(0,0,0,.06)),linear-gradient(180deg,#ebe7e8_0%,#ded9db_100%)] p-4 shadow-[0_28px_70px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.54)] lg:block"
    >
      <div className="tc-sheen mb-4 h-[3px] rounded-full bg-[linear-gradient(90deg,#621638,#A52E64,#c45b8b)] shadow-[0_8px_22px_rgba(165,46,100,.28)]" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A52E64]">
            Resumen
          </p>
          <h2 className="mt-1 text-[18px] font-black tracking-[-0.04em] text-[#201a1d]">
            Datos de creación
          </h2>
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#A52E64]/10 text-[#A52E64] ring-1 ring-[#A52E64]/15">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-full bg-[#c5bec1] shadow-[inset_0_1px_2px_rgba(0,0,0,.12)]">
        <motion.div
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="h-2 rounded-full bg-[linear-gradient(90deg,#621638,#A52E64,#c45b8b)]"
        />
      </div>

      <div className="mt-4 grid gap-2">
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
        <div className="mt-4 flex gap-2 rounded-[15px] border border-[#c7bfc3] bg-[#e9e4e6] p-3 text-[11px] font-bold leading-relaxed text-[#7b7277]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#A52E64]" />
          Nombre y fecha son obligatorios para crear la revista.
        </div>
      ) : null}
    </motion.section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-black/5 bg-[#ebe7e8]/70 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.32)]">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#81777b]">
        {label}
      </span>
      <span className="max-w-[180px] truncate text-right text-[12px] font-black text-[#201a1d]">
        {value}
      </span>
    </div>
  );
}

function MobileActionBar({ canCreate, progress }: { canCreate: boolean; progress: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[linear-gradient(to_top,rgba(17,17,19,.98)_70%,rgba(17,17,19,.74)_88%,transparent)] px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-5 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-[440px] gap-2">
        <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/46">
          <span>Progreso</span>
          <span className="text-[#f4f0f2]">{progress}%</span>
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