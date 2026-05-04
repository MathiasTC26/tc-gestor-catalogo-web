import Link from "next/link";
import { ArrowLeft, FilePenLine } from "lucide-react";

export default function EditPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#101011] px-3 py-4 text-[#221d20] sm:px-5 lg:px-7">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-18%,rgba(255,255,255,.08),transparent_32%),linear-gradient(180deg,#151416_0%,#101011_72%)]" />
      <section className="relative mx-auto w-full max-w-[920px] rounded-[30px] border border-white/35 bg-[linear-gradient(145deg,#e4dfe1,#d5d0d2_62%,#cbc5c8)] p-3 shadow-[0_34px_90px_rgba(0,0,0,.42),inset_0_1px_0_rgba(255,255,255,.75)] sm:p-5">
        <header className="tc-sheen relative overflow-hidden rounded-[26px] bg-[#232124] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:p-5">
          <div className="relative z-10 grid gap-4 sm:grid-cols-[104px_1fr] sm:items-center">
            <div className="grid h-[88px] w-[88px] place-items-center rounded-[24px] border border-white/25 bg-white p-3 shadow-[0_20px_38px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.65)] sm:h-[104px] sm:w-[104px]">
              <img src="/Todo-Costura.png" alt="Todo Costura" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#d9b9c9]">Centro operativo</p>
              <h1 className="mt-1 text-[38px] font-black leading-[0.9] tracking-[-0.075em] text-[#f4f1f3] sm:text-[58px]">Editar revista</h1>
              <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#f4f1f3]/68 sm:text-[15px]">Pantalla preparada para conectar la búsqueda y edición de revistas existentes.</p>
            </div>
          </div>
        </header>
        <section className="mt-4 rounded-[25px] border border-[#bdb5b9] bg-[linear-gradient(180deg,#e9e4e6,#ded9db)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.52)]">
          <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-[#bdb5b9] bg-[#e8e3e5] text-[#A52E64]"><FilePenLine className="h-6 w-6" /></div>
          <h2 className="mt-5 text-[32px] font-black leading-[0.95] tracking-[-0.065em] text-[#241f22]">Módulo pendiente</h2>
          <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-[#655c61]">Esta ruta queda creada para evitar 404. La lógica real de edición se conecta cuando esté definida la API.</p>
          <Link href="/" className="tc-primary-button mt-5 inline-flex items-center justify-center gap-2 no-underline"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        </section>
      </section>
    </main>
  );
}
