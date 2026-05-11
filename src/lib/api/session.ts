export type ValidateRevistaSessionResult = {
  valid: boolean;
  flow: string;
  action: string;
  record_id: string;
};

export async function validate_revista_session(
  flow: string,
): Promise<ValidateRevistaSessionResult> {
  const cleanFlow = flow.trim();

  if (!cleanFlow) {
    throw new Error("La sesión de acceso no está activa.");
  }

  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_REVISTA_API_BASE_URL ??
    "https://tc-gestor-revista-api.todocostura.workers.dev"
  ).replace(/\/$/, "");

  const response = await fetch(
    `${apiBaseUrl}/api/revista/session/validate?flow=${encodeURIComponent(
      cleanFlow,
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
        "La sesión de acceso no está activa.",
    );
  }

  const data = payload?.data;

  if (!data?.valid) {
    throw new Error("La sesión de acceso no está activa.");
  }

  return {
    valid: true,
    flow: String(data.flow || cleanFlow),
    action: String(data.action || ""),
    record_id: String(data.record_id || ""),
  };
}