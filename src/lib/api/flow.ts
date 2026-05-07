const API_BASE_URL =
  process.env.NEXT_PUBLIC_REVISTA_API_BASE_URL ??
  "https://tc-gestor-revista-api.todocostura.workers.dev";

export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: unknown;
};

export type CreateRevistaResponse = {
  record_id: string;
  nro: number;
  products_flow: string;
};

export type SearchResultEnvelope<T> = {
  ok: boolean;
  data: T;
};

export type SavePdfResponse = {
  saved_token: string;
  saved_url: string;
  workdrive_response: unknown;
};

export function get_api_base_url(): string {
  return API_BASE_URL.replace(/\/$/, "");
}

export function build_api_url(path: string): string {
  const normalized_path = path.startsWith("/") ? path : `/${path}`;

  return `${get_api_base_url()}${normalized_path}`;
}

export async function api_get<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(build_api_url(path), {
    ...init,
    method: "GET",
    cache: "no-store",
  });

  return read_api_response<T>(response);
}

export async function api_post<T>(
  path: string,
  body: unknown,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(build_api_url(path), {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return read_api_response<T>(response);
}

export function get_flow_from_url(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return new URL(window.location.href).searchParams.get("flow") ?? "";
}

export function with_flow(path: string, flow: string): string {
  const separator = path.includes("?") ? "&" : "?";

  return flow ? `${path}${separator}flow=${encodeURIComponent(flow)}` : path;
}

export async function create_revista(
  payload: Record<string, unknown>,
  flow: string,
): Promise<CreateRevistaResponse> {
  return api_post<CreateRevistaResponse>(
    with_flow("/api/revista/create", flow),
    {
      ...payload,
      flow,
    },
  );
}

export async function update_revista(
  payload: Record<string, unknown>,
  flow: string,
): Promise<Record<string, unknown>> {
  return api_post<Record<string, unknown>>(
    with_flow("/api/revista/update", flow),
    {
      ...payload,
      flow,
    },
  );
}

export async function get_revista_for_edit(
  record_id: string,
  flow: string,
): Promise<SearchResultEnvelope<Record<string, unknown>>> {
  const params = new URLSearchParams({
    record_id,
    flow,
  });

  return api_get<SearchResultEnvelope<Record<string, unknown>>>(
    `/api/revista/revistas/get?${params.toString()}`,
  );
}

export async function search_products<T>(
  query: string,
  flow: string,
  tipo_cliente_precio?: string,
): Promise<SearchResultEnvelope<T>> {
  const params = new URLSearchParams({
    q: query,
    flow,
  });

  if (tipo_cliente_precio) {
    params.set("tipo_cliente_precio", tipo_cliente_precio);
  }

  return api_get<SearchResultEnvelope<T>>(
    `/api/revista/products/search?${params.toString()}`,
  );
}

export async function search_accounts<T>(
  query: string,
): Promise<SearchResultEnvelope<T>> {
  const params = new URLSearchParams({
    q: query,
  });

  return api_get<SearchResultEnvelope<T>>(
    `/api/revista/accounts/search?${params.toString()}`,
  );
}

export async function search_contacts<T>(
  query: string,
): Promise<SearchResultEnvelope<T>> {
  const params = new URLSearchParams({
    q: query,
  });

  return api_get<SearchResultEnvelope<T>>(
    `/api/revista/contacts/search?${params.toString()}`,
  );
}

export async function search_revistas<T>(
  query: string,
): Promise<SearchResultEnvelope<T>> {
  const params = new URLSearchParams({
    q: query,
  });

  return api_get<SearchResultEnvelope<T>>(
    `/api/revista/revistas/search?${params.toString()}`,
  );
}

export async function save_pdf(
  payload: Record<string, unknown>,
  flow: string,
): Promise<SavePdfResponse> {
  return api_post<SavePdfResponse>(
    with_flow("/api/revista/save-pdf", flow),
    {
      ...payload,
      flow,
    },
  );
}

async function read_api_response<T>(response: Response): Promise<T> {
  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("El API devolvió una respuesta inválida.");
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data
        ? JSON.stringify((data as { error: unknown }).error)
        : `Error HTTP ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}