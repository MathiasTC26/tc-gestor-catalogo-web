export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#111113] flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-[28px] bg-[#e2dddf] p-6 shadow-2xl">
        <div className="h-[3px] rounded-full bg-[#A52E64] mb-5" />

        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#A52E64]">
          TC Sistema
        </p>

        <h1 className="mt-2 text-[19px] font-bold text-[#1f191c]">
          Gestor de catálogo
        </h1>

        <p className="mt-2 text-[13px] leading-relaxed text-[#5e5559]">
          Acceso preparado para flujos seguros desde Creator.
        </p>

        <a
          href="/launch?target=dashboard"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#A52E64] px-4 text-[13px] font-bold text-white transition hover:brightness-95 active:scale-[0.98]"
        >
          Abrir acceso seguro
        </a>
      </section>
    </main>
  );
}
