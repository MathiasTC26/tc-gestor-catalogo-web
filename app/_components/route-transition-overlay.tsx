"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type RouteTransitionOverlayProps = {
  show: boolean;
  title?: string;
  description?: string;
};

export function RouteTransitionOverlay({
  show,
  title = "Cargando",
  description = "Preparando la siguiente sección...",
}: RouteTransitionOverlayProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[9999] grid place-items-center bg-[#141214]/75 px-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="status"
          aria-live="polite"
        >
          <motion.div
            className="relative w-full max-w-[340px] overflow-hidden rounded-[28px] border border-[#c7bec2] bg-[#ded9db] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
            initial={{ y: 14, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="pointer-events-none absolute -left-16 top-0 h-full w-24 rotate-12 bg-white/25 blur-xl" />

            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#b98aa2]/45 bg-[#A52E64]/10 text-[#A52E64] shadow-inner">
              <Loader2 className="size-7 animate-spin" aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-[1.05rem] font-black tracking-[-0.03em] text-[#221f23]">
              {title}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#71686e]">
              {description}
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
