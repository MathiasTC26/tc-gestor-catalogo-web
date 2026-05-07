"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Building2,
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
import {
  get_flow_from_url,
  get_revista_for_edit,
  search_accounts,
  search_contacts,
  search_revistas,
  update_revista,
} from "@/src/lib/api/flow";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
  productsFlow?: string;
  previewToken?: string;
};

type ApiSearchRevista = {
  record_id?: string;
  id?: string;
  nro?: number | string;
  nro_revista?: number | string;
  Nro_Revista?: number | string;
  nombre_revista?: string;
  fecha_publicacion?: string;
  edicion?: string;
  cliente_tipo?: string;
  cliente_nombre?: string;
  cliente_codigo?: string;
};

type ApiClient = {
  id?: string;
  nombre?: string;
  ci?: string;
  ruc?: string;
  telefono?: string;
  correo?: string;
  empresa?: string;
  tipoCliente?: string;
  codCliente?: string;
  meta?: unknown;
};

type ApiEditData = Record<string, unknown>;

const limits = {
  nameMax: 180,
  editionMax: 30,
  priceMax: 999999999,
  printRunsMax: 100000,
  sheetsMax: 50,
  articlesMax: 150,
  columnsMax: 4,
};

export default function EditPage() {
  const router = useRouter();

  const [flow, setFlow] = useState("");
  const [query, setQuery] = useState("");
  const [revistaResults, setRevistaResults] = useState<RevistaRecord[]>([]);
  const [selectedRevista, setSelectedRevista] = useState<RevistaRecord | null>(
    null,
  );

  const [name, setName] = useState("");
  const [edition, setEdition] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [price, setPrice] = useState("");
  const [printRuns, setPrintRuns] = useState(1);
  const [maxSheets, setMaxSheets] = useState(1);
  const [maxArticles, setMaxArticles] = useState(1);
  const [columns, setColumns] = useState(1);

  const [originalClient, setOriginalClient] = useState<ClientRecord | null>(
    null,
  );
  const [workingClient, setWorkingClient] = useState<ClientRecord | null>(null);
  const [changeClient, setChangeClient] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<ClientRecord[]>([]);

  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSearchingRevistas, setIsSearchingRevistas] = useState(false);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const saveLockRef = useRef(false);
  const routeLockRef = useRef(false);

  useEffect(() => {
    const urlFlow = get_flow_from_url();
    const storedFlow = sessionStorage.getItem("revista_flow") || "";
    const currentFlow = urlFlow || storedFlow;

    const params = new URL(window.location.href).searchParams;
    const recordId =
      params.get("record_id") ||
      params.get("id") ||
      params.get("creator_record_id") ||
      "";

    setFlow(currentFlow);

    if (currentFlow) {
      sessionStorage.setItem("revista_flow", currentFlow);
    }

    cleanSensitiveUrlParams();

    if (recordId) {
      void loadRevistaById(recordId, currentFlow);
    }
  }, []);

  useEffect(() => {
    const clean = query.trim();

    if (selectedRevista) return;

    if (clean.length < 1) {
      setRevistaResults([]);
      setIsSearchingRevistas(false);
      setErrorMessage("");
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingRevistas(true);
        setErrorMessage("");

        const response = await search_revistas<ApiSearchRevista[]>(clean);

        if (cancelled) return;

        const normalized = response.data
          .map(normalizeSearchRevista)
          .filter((item): item is RevistaRecord => item !== null);

        setRevistaResults(normalized);
      } catch (error) {
        if (cancelled) return;

        setRevistaResults([]);
        setErrorMessage(
          error instanceof Error &&
            error.message.includes("flow es obligatorio")
            ? "No se pudo buscar revistas porque la sesión no está disponible."
            : error instanceof Error
              ? error.message
              : "No se pudo buscar revistas.",
        );
      } finally {
        if (!cancelled) setIsSearchingRevistas(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, selectedRevista]);

  useEffect(() => {
    const clean = clientQuery.trim();

    if (!changeClient || !originalClient || workingClient) return;

    if (clean.length < 1) {
      setClientResults([]);
      setIsSearchingClients(false);
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingClients(true);
        setErrorMessage("");

        const response =
          originalClient.type === "empresa"
            ? await search_accounts<ApiClient[]>(clean)
            : await search_contacts<ApiClient[]>(clean);

        if (cancelled) return;

        const normalized = response.data
          .map((client) => normalizeApiClient(client, originalClient.type))
          .filter((client): client is ClientRecord => client !== null);

        setClientResults(normalized);
      } catch (error) {
        if (cancelled) return;

        setClientResults([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo buscar clientes.",
        );
      } finally {
        if (!cancelled) setIsSearchingClients(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [changeClient, clientQuery, originalClient, workingClient]);

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
    saveLockRef.current = false;
  }

  async function loadRevistaById(recordId: string, currentFlow = flow) {
    if (!recordId) return;

    try {
      setIsLoadingRecord(true);
      setErrorMessage("");

      const response = await get_revista_for_edit(recordId, currentFlow);
      const apiData = response.data as ApiEditData;

      cacheSavedPreviewDataFromApiData(apiData);

      const normalized = normalizeEditRevista(apiData, recordId);

      loadRevista(normalized);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la revista para editar.",
      );
    } finally {
      setIsLoadingRecord(false);
    }
  }

  async function selectRevistaFromSearch(revista: RevistaRecord) {
    await loadRevistaById(revista.id, flow);
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
    setClientResults([]);
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
    setClientResults([]);
    markDirty();
  }

  async function saveChanges() {
    if (
      !selectedRevista ||
      !workingClient ||
      !canSave ||
      !dirty ||
      saved ||
      isSavingChanges ||
      isRouteLoading ||
      saveLockRef.current
    ) {
      return;
    }

    try {
      saveLockRef.current = true;
      setIsSavingChanges(true);
      setErrorMessage("");

      const payload = buildUpdatePayload({
        recordId: selectedRevista.id,
        name,
        edition,
        publicationDate,
        price,
        printRuns,
        maxSheets,
        maxArticles,
        columns,
        client: workingClient,
      });

      await update_revista(payload, flow);

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

      saveRevistaMeta(updated, flow);
    } catch (error) {
      saveLockRef.current = false;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setIsSavingChanges(false);
    }
  }

  async function continueToProducts() {
    if (
      !selectedRevista ||
      !workingClient ||
      !canContinue ||
      isSavingChanges ||
      isRouteLoading ||
      routeLockRef.current
    ) {
      return;
    }

    routeLockRef.current = true;

    const updated: RevistaRecord = {
      ...selectedRevista,
      name: name.trim() || selectedRevista.name,
      edition: edition.trim(),
      publicationDate,
      price,
      printRuns,
      maxSheets,
      maxArticles,
      columns,
      client: workingClient,
    };

    try {
      saveRevistaMeta(updated, flow);

      if (flow) {
        sessionStorage.setItem("revista_flow", flow);
      }

      setIsRouteLoading(true);
      setErrorMessage("");

      await loadSavedPreviewSnapshotForEdit(updated);

      const target = "/products";

      window.setTimeout(() => {
        router.push(target);

        window.setTimeout(() => {
          if (window.location.pathname !== "/products") {
            window.location.assign(target);
          }
        }, 700);
      }, 850);
    } catch (error) {
      routeLockRef.current = false;
      setIsRouteLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los productos de la revista.",
      );
    }
  }

  async function loadSavedPreviewSnapshotForEdit(revista: RevistaRecord) {
    const directProductsRaw = sessionStorage.getItem(
      "revista_edit_saved_preview_productos",
    );
    const directLabelsRaw = sessionStorage.getItem(
      "revista_edit_saved_preview_labels",
    );

    if (directProductsRaw || directLabelsRaw) {
      try {
        const directProducts = directProductsRaw
          ? JSON.parse(directProductsRaw)
          : [];
        const directLabels = directLabelsRaw ? JSON.parse(directLabelsRaw) : [];
        const validProducts = Array.isArray(directProducts)
          ? directProducts
          : [];
        const validLabels = Array.isArray(directLabels) ? directLabels : [];

        sessionStorage.removeItem("revista_edit_saved_preview_productos");
        sessionStorage.removeItem("revista_edit_saved_preview_labels");

        if (validProducts.length > 0 || validLabels.length > 0) {
          sessionStorage.setItem(
            "revista_productos",
            JSON.stringify(validProducts),
          );
          sessionStorage.setItem("revista_labels", JSON.stringify(validLabels));
          return;
        }
      } catch {
        sessionStorage.removeItem("revista_edit_saved_preview_productos");
        sessionStorage.removeItem("revista_edit_saved_preview_labels");
      }
    }

    const token = revista.previewToken?.trim() || "";

    if (!token) {
      sessionStorage.removeItem("revista_labels");
      sessionStorage.removeItem("revista_productos");
      return;
    }

    const response = await fetch(
      `${getApiBaseUrl()}/api/revista/preview/saved?tk=${encodeURIComponent(
        token,
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
          "No se pudo cargar el preview guardado de la revista.",
      );
    }

    const snapshot = payload?.data ?? payload;

    const labels = Array.isArray(snapshot?.labels) ? snapshot.labels : [];
    const products = Array.isArray(snapshot?.productos)
      ? snapshot.productos
      : [];

    sessionStorage.setItem("revista_labels", JSON.stringify(labels));
    sessionStorage.setItem("revista_productos", JSON.stringify(products));
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

          <Intro
            selectedRevista={selectedRevista}
            dirty={dirty}
            saved={saved}
          />

          {errorMessage ? (
            <section className="mt-4 rounded-[18px] border border-[#A52E64]/25 bg-[#A52E64]/10 px-4 py-3 text-[12px] font-black leading-relaxed text-[#A52E64]">
              {errorMessage}
            </section>
          ) : null}

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

                  {!selectedRevista && query.trim().length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid gap-2"
                    >
                      {isLoadingRecord ? (
                        <EmptyBox text="Cargando revista..." />
                      ) : isSearchingRevistas ? (
                        <EmptyBox text="Buscando revistas..." />
                      ) : revistaResults.length > 0 ? (
                        revistaResults.map((revista) => (
                          <button
                            key={revista.id}
                            type="button"
                            onClick={() =>
                              void selectRevistaFromSearch(revista)
                            }
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
                                {revista.client.name} ·{" "}
                                {revista.edition || "Sin edición"} ·{" "}
                                {formatDisplayDate(revista.publicationDate)}
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
                              setClientResults([]);
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
                              setClientResults([]);
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
                                {originalClient?.type === "empresa"
                                  ? "Empresa"
                                  : "Contacto"}
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
                                {isSearchingClients ? (
                                  <EmptyBox text="Buscando clientes..." />
                                ) : clientResults.length > 0 ? (
                                  clientResults.map((client) => (
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
                                          {client.code || "Sin código"} ·{" "}
                                          {client.ruc ||
                                            client.ci ||
                                            "Sin documento"}{" "}
                                          · {client.priceType}
                                        </span>
                                      </span>

                                      <ChevronRight className="h-4 w-4 shrink-0 text-[#A52E64] opacity-60 transition group-hover:translate-x-0.5" />
                                    </button>
                                  ))
                                ) : clientQuery.trim().length < 1 ? (
                                  <EmptyBox text="Escribí para buscar clientes." />
                                ) : (
                                  <EmptyBox text="No hay clientes disponibles con esa búsqueda." />
                                )}
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
                              setName(
                                event.target.value.slice(0, limits.nameMax),
                              );
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
                                setEdition(
                                  event.target.value.slice(
                                    0,
                                    limits.editionMax,
                                  ),
                                );
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
                            onChange={(event) =>
                              updateMoney(event.target.value)
                            }
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
                              updateNumber(
                                setPrintRuns,
                                value,
                                1,
                                limits.printRunsMax,
                              )
                            }
                          />
                          <NumberControl
                            label="Máx. hojas"
                            value={maxSheets}
                            min={1}
                            max={limits.sheetsMax}
                            onChange={(value) =>
                              updateNumber(
                                setMaxSheets,
                                value,
                                1,
                                limits.sheetsMax,
                              )
                            }
                          />
                          <NumberControl
                            label="Máx. artículos"
                            value={maxArticles}
                            min={1}
                            max={limits.articlesMax}
                            onChange={(value) =>
                              updateNumber(
                                setMaxArticles,
                                value,
                                1,
                                limits.articlesMax,
                              )
                            }
                          />
                          <NumberControl
                            label="Columnas"
                            value={columns}
                            min={1}
                            max={limits.columnsMax}
                            onChange={(value) =>
                              updateNumber(
                                setColumns,
                                value,
                                1,
                                limits.columnsMax,
                              )
                            }
                          />
                        </div>
                      </div>
                    </FormCard>

                    <EditActionsPanel
                      dirty={dirty}
                      saved={saved}
                      canSave={
                        canSave &&
                        dirty &&
                        !saved &&
                        !isSavingChanges &&
                        !isRouteLoading
                      }
                      canContinue={
                        canContinue && !isSavingChanges && !isRouteLoading
                      }
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
        show={isSavingChanges || isRouteLoading || isLoadingRecord}
        title={
          isLoadingRecord
            ? "Cargando revista"
            : isSavingChanges
              ? "Guardando cambios"
              : "Cargando productos"
        }
        description={
          isLoadingRecord
            ? "Obteniendo datos desde Zoho Creator..."
            : isSavingChanges
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
            Buscá una revista existente, ajustá sus datos y continuá al flujo de
            productos.
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
      <RailItem
        active={!selected}
        done={selected}
        icon={<Search />}
        title="Buscar"
        subtitle="Revista"
        number="01"
      />
      <RailItem
        active={selected && dirty}
        done={selected && !dirty}
        icon={<FilePenLine />}
        title="Editar"
        subtitle="Datos"
        number="02"
      />
      <RailItem
        active={selected && !dirty}
        icon={<PackageSearch />}
        title="Productos"
        subtitle="Continuar"
        number="03"
      />
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
            {selectedRevista
              ? `Revista #${selectedRevista.number}`
              : "Seleccionar revista"}
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
            value={
              !selectedRevista
                ? "Pendiente"
                : dirty
                  ? "Sin guardar"
                  : saved
                    ? "Guardado"
                    : "Listo"
            }
            strong
          />
          <InfoChip label="Modo" value="Web" />
        </div>
      </div>
    </section>
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
          {client.type === "empresa" ? (
            <Building2 className="h-4 w-4" />
          ) : (
            <Contact className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-[#241f22]">
            {client.name}
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#62595d]">
            {client.type === "empresa" ? "Empresa" : "Contacto"} ·{" "}
            {client.priceType} · {client.code || "Sin código"}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DataPill label="CI" value={client.ci ?? "—"} />
            <DataPill label="RUC" value={client.ruc ?? "—"} />
            <DataPill label="Teléfono" value={client.phone ?? "—"} />
            <DataPill label="Correo" value={client.email ?? "—"} />
            <DataPill
              label="Detalle"
              value={client.company ?? "Cuenta seleccionada"}
            />
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
      <p className="mt-1 truncate text-[11px] font-bold text-[#655c61]">
        {value}
      </p>
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
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState(selected ?? today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const monthStartDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array.from({ length: monthStartDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function moveMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="tc-input flex items-center justify-between gap-3 text-left"
      >
        <span className={value ? "text-[#201a1d]" : "text-[#8a8085]"}>
          {value ? formatDisplayDate(value) : "Seleccionar fecha"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#8a7f85] transition ${
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
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[280px] rounded-[18px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#ebe7e8,#ded9db)] p-3 shadow-[0_24px_54px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.54)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="grid h-9 w-9 place-items-center rounded-[12px] text-[#A52E64] transition hover:bg-[#A52E64]/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-[13px] font-black text-[#241f22]">
                {viewDate.toLocaleDateString("es-PY", {
                  month: "long",
                  year: "numeric",
                })}
              </span>

              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="grid h-9 w-9 place-items-center rounded-[12px] text-[#A52E64] transition hover:bg-[#A52E64]/10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {["D", "L", "M", "M", "J", "V", "S"].map((day) => (
                <div
                  key={day}
                  className="py-1 text-[9px] font-black text-[#81777b]"
                >
                  {day}
                </div>
              ))}

              {cells.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-9" />;
                }

                const date = new Date(year, month, day);
                const dateValue = formatDate(date);
                const isSelected = value === dateValue;
                const isToday = formatDate(today) === dateValue;

                return (
                  <button
                    key={dateValue}
                    type="button"
                    onClick={() => {
                      onChange(dateValue);
                      setOpen(false);
                    }}
                    className={`h-9 rounded-[11px] text-[12px] font-black transition active:scale-95 ${
                      isSelected
                        ? "bg-[#A52E64] text-[#f7f2f4] shadow-[0_10px_20px_rgba(165,46,100,.24)]"
                        : isToday
                          ? "border border-[#A52E64]/35 bg-[#A52E64]/10 text-[#A52E64] hover:bg-[#A52E64]/15"
                          : "bg-[#e8e3e5] text-[#241f22] hover:bg-[#A52E64]/10 hover:text-[#A52E64]"
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
          {isSaving
            ? "Guardando"
            : dirty
              ? "Guardar cambios"
              : saved
                ? "Guardado"
                : "Sin cambios"}
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue || isRouteLoading}
          className="min-h-12 rounded-[16px] border border-[#b9b0b5] bg-[#ebe7e8] px-4 text-[13px] font-black text-[#A52E64] shadow-[inset_0_1px_0_rgba(255,255,255,.42)] transition hover:bg-[#A52E64]/10 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="inline-flex items-center justify-center gap-2">
            Continuar a productos
            <ChevronRight className="h-4 w-4" />
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

function cacheSavedPreviewDataFromApiData(data: ApiEditData) {
  const products = Array.isArray(data.saved_preview_productos)
    ? data.saved_preview_productos
    : Array.isArray(data.productos)
      ? data.productos
      : [];

  const labels = Array.isArray(data.saved_preview_labels)
    ? data.saved_preview_labels
    : Array.isArray(data.labels)
      ? data.labels
      : [];

  if (products.length > 0 || labels.length > 0) {
    sessionStorage.setItem(
      "revista_edit_saved_preview_productos",
      JSON.stringify(products),
    );
    sessionStorage.setItem(
      "revista_edit_saved_preview_labels",
      JSON.stringify(labels),
    );

    sessionStorage.setItem("revista_productos", JSON.stringify(products));
    sessionStorage.setItem("revista_labels", JSON.stringify(labels));
    return;
  }

  sessionStorage.removeItem("revista_edit_saved_preview_productos");
  sessionStorage.removeItem("revista_edit_saved_preview_labels");
  sessionStorage.removeItem("revista_productos");
  sessionStorage.removeItem("revista_labels");
}

function normalizeSearchRevista(input: ApiSearchRevista): RevistaRecord | null {
  const id = String(input.record_id ?? input.id ?? "").trim();
  if (!id) return null;

  const number =
    parseRevistaNumber(input.nro) ||
    parseRevistaNumber(input.nro_revista) ||
    parseRevistaNumber(input.Nro_Revista);

  return {
    id,
    number,
    name: String(input.nombre_revista ?? "Revista sin nombre").trim(),
    edition: String(input.edicion ?? "").trim(),
    publicationDate: normalizeDateString(input.fecha_publicacion),
    price: "",
    printRuns: 1,
    maxSheets: 1,
    maxArticles: 1,
    columns: 1,
    client: {
      id: String(input.cliente_codigo ?? "cliente").trim(),
      type: normalizeClientType(input.cliente_tipo),
      priceType: String(input.cliente_tipo ?? "").trim(),
      name: String(input.cliente_nombre ?? "Cliente no asignado").trim(),
      code: String(input.cliente_codigo ?? "").trim(),
    },
  };
}

function normalizeEditRevista(
  data: ApiEditData,
  fallbackId: string,
): RevistaRecord {
  const clientType = normalizeClientType(
    readString(data, "cliente_tipo") ||
      readString(data, "tipo_cliente") ||
      readString(data, "Tipo_de_Cliente"),
  );

  const clientName =
    readString(data, "cliente_nombre") ||
    readString(data, "nombre_cliente") ||
    readString(data, "Nombre_Cliente") ||
    readString(data, "nombre_cuenta") ||
    readString(data, "Nombre_Cuenta") ||
    "Cliente no asignado";

  const clientCode =
    readString(data, "cliente_codigo") ||
    readString(data, "cod_cliente") ||
    readString(data, "Cod_cliente") ||
    readString(data, "cod_cuenta") ||
    readString(data, "Cod_cuenta") ||
    "";

  return {
    id: readString(data, "record_id") || readString(data, "ID") || fallbackId,
    number:
      readNumber(data, "nro") ||
      readNumber(data, "nro_revista") ||
      readNumber(data, "Nro_Revista") ||
      0,
    name:
      readString(data, "nombre_revista") ||
      readString(data, "Nombre_Revista") ||
      "Revista sin nombre",
    edition: readString(data, "edicion") || readString(data, "Edici_n"),
    publicationDate:
      normalizeDateString(
        readString(data, "fecha_publicacion") ||
          readString(data, "Fecha_Publicacion"),
      ) || formatDate(new Date()),
    price: formatMoneyInput(
      readNumber(data, "precio_revista") ||
        readNumber(data, "Precio_de_Revista"),
    ),
    printRuns: readNumber(data, "tiradas") || readNumber(data, "Tiradas") || 1,
    maxSheets:
      readNumber(data, "max_hojas") || readNumber(data, "Max_Hojas") || 1,
    maxArticles:
      readNumber(data, "max_articulos") ||
      readNumber(data, "Max_Art_culos") ||
      1,
    columns: readNumber(data, "columnas") || readNumber(data, "Columnas") || 1,
    productsFlow:
      readString(data, "products_flow_token") ||
      readString(data, "products_flow"),
    previewToken: extractPreviewTokenFromRevista(data),
    client: {
      id: clientCode || "cliente",
      type: clientType,
      priceType:
        readString(data, "tipo_cliente_precio") ||
        readString(data, "cliente_tipo_precio") ||
        readString(data, "Tipo_de_Cliente") ||
        "",
      name: clientName,
      code: clientCode,
      ci:
        readString(data, "cliente_cedula") ||
        readString(data, "cedula") ||
        readString(data, "C_dula"),
      ruc:
        readString(data, "cliente_ruc") ||
        readString(data, "ruc_contacts") ||
        readString(data, "RUC_contacts") ||
        readString(data, "ruc_accounts") ||
        readString(data, "RUC_accounts"),
      phone:
        readString(data, "cliente_telefono") ||
        readString(data, "telefono_contacts") ||
        readString(data, "M_vil_Cliente") ||
        readString(data, "telefono_accounts") ||
        readString(data, "Movil_Cuenta"),
      email:
        readString(data, "cliente_email") ||
        readString(data, "email_contacts") ||
        readString(data, "Email_contacts") ||
        readString(data, "email_accounts") ||
        readString(data, "Email_accounts"),
    },
  };
}

function normalizeApiClient(
  input: ApiClient,
  type: ClientType,
): ClientRecord | null {
  const id = String(input.id ?? "").trim();
  const name = String(input.nombre ?? "").trim();

  if (!id || !name) return null;

  return {
    id,
    type,
    priceType: String(input.tipoCliente ?? "").trim(),
    name,
    code: String(input.codCliente ?? "").trim(),
    ci: String(input.ci ?? "").trim(),
    ruc: String(input.ruc ?? "").trim(),
    phone: String(input.telefono ?? "").trim(),
    email: String(input.correo ?? "").trim(),
    company: String(input.empresa ?? "").trim(),
  };
}

function buildUpdatePayload({
  recordId,
  name,
  edition,
  publicationDate,
  price,
  printRuns,
  maxSheets,
  maxArticles,
  columns,
  client,
}: {
  recordId: string;
  name: string;
  edition: string;
  publicationDate: string;
  price: string;
  printRuns: number;
  maxSheets: number;
  maxArticles: number;
  columns: number;
  client: ClientRecord;
}) {
  const base: Record<string, unknown> = {
    record_id: recordId,
    nombre_revista: name.trim(),
    edicion: edition.trim(),
    fecha: publicationDate,
    precio_revista: normalizeMoneyNumber(price),
    tiradas: printRuns,
    max_hojas: maxSheets,
    max_articulos: maxArticles,
    columnas: columns,
    tipo_cliente_precio: client.priceType,
  };

  if (client.type === "empresa") {
    return {
      ...base,
      nombre_cuenta: client.name,
      ruc_accounts: client.ruc || "",
      telefono_accounts: client.phone || "",
      email_accounts: client.email || "",
      cod_cuenta: client.code || "",
    };
  }

  return {
    ...base,
    nombre_cliente: client.name,
    cedula: client.ci || "",
    ruc_contacts: client.ruc || "",
    telefono_contacts: client.phone || "",
    email_contacts: client.email || "",
    cod_cliente: client.code || "",
  };
}

function saveRevistaMeta(revista: RevistaRecord, flow: string) {
  sessionStorage.setItem(
    "revista_preview_meta",
    JSON.stringify({
      number: revista.number,
      title: revista.name,
      client: revista.client.name,
      maxSheets: revista.maxSheets,
      maxColumns: revista.columns,
      maxArticles: revista.maxArticles,
      tipoClientePrecio: revista.client.priceType,
      recordId: revista.id,
    }),
  );

  sessionStorage.setItem("revista_flow", flow);
}

function readString(data: ApiEditData, key: string) {
  const value = data[key];

  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  if (typeof value === "object" && value !== null) {
    const nested = value as Record<string, unknown>;

    if (typeof nested.display_value === "string")
      return nested.display_value.trim();
    if (typeof nested.value === "string") return nested.value.trim();
    if (typeof nested.ID === "string") return nested.ID.trim();
  }

  return "";
}

function readNumber(data: ApiEditData, key: string) {
  const value = data[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\D/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeClientType(value: unknown): ClientType {
  const clean = String(value ?? "").toLowerCase();

  if (
    clean.includes("empresa") ||
    clean.includes("cuenta") ||
    clean.includes("account")
  ) {
    return "empresa";
  }

  return "contacto";
}

function normalizeDateString(value: unknown) {
  const clean = String(value ?? "").trim();

  if (!clean) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const match = clean.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const months: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };

    const day = match[1].padStart(2, "0");
    const month = months[match[2].toLowerCase()] ?? "01";
    const year = match[3];

    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) return formatDate(parsed);

  return "";
}

function normalizeMoneyNumber(value: string) {
  return Number(value.replace(/\D/g, "")) || 0;
}

function formatMoneyInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  return value.toLocaleString("es-PY");
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  if (!value) return "Sin fecha";

  const parsed = parseDate(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_REVISTA_API_BASE_URL ??
    "https://tc-gestor-revista-api.todocostura.workers.dev"
  ).replace(/\/+$/, "");
}

function extractPreviewTokenFromRevista(data: ApiEditData) {
  const previewUrl =
    readUrlField(data, "PDF_Revista") ||
    readUrlField(data, "pdf_revista") ||
    readUrlField(data, "preview_url") ||
    readUrlField(data, "Preview_Revista_URL");

  if (!previewUrl) {
    return "";
  }

  try {
    const parsed = new URL(previewUrl);
    return parsed.searchParams.get("tk") || "";
  } catch {
    const match = previewUrl.match(/[?&]tk=([^&#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }
}

function readUrlField(data: ApiEditData, key: string) {
  const value = data[key];

  if (typeof value === "string") {
    return extractUrlFromText(value);
  }

  if (typeof value === "object" && value !== null) {
    const nested = value as Record<string, unknown>;

    const direct =
      extractUrlFromText(nested.url) ||
      extractUrlFromText(nested.href) ||
      extractUrlFromText(nested.link) ||
      extractUrlFromText(nested.value) ||
      extractUrlFromText(nested.display_value);

    if (direct) {
      return direct;
    }
  }

  return "";
}

function extractUrlFromText(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  const hrefMatch = text.match(/href=["']([^"']+)["']/i);
  if (hrefMatch?.[1]) {
    return hrefMatch[1].trim();
  }

  const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/i);
  return urlMatch?.[0] ?? "";
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
function parseRevistaNumber(value: unknown) {
  const clean = String(value ?? "")
    .replace(/#/g, "")
    .trim();

  const parsed = Number.parseInt(clean, 10);

  return Number.isFinite(parsed) ? parsed : 0;
}