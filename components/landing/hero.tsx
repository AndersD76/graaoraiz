"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(111,207,62,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(111,207,62,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24 pb-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-border bg-brand-surface/60 backdrop-blur-sm mb-8"
        >
          <span className="text-brand-gold text-sm">&#9889;</span>
          <span className="text-sm text-brand-muted">
            EUDR entra em vigor em 2025 — prepare-se agora
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05] text-brand-text mb-6"
        >
          Rastreabilidade
          <br />
          <span className="text-brand-accent">que vale dinheiro.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lg sm:text-xl text-brand-muted max-w-2xl mx-auto mb-10"
        >
          Caderneta digital de campo + inteligência de preços em tempo real.
          Compliance EUDR pronto para exportação, do talhão ao porto.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            href="/cadastro"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-brand-accent text-brand-bg font-semibold text-base hover:brightness-110 transition-all shadow-lg shadow-brand-accent/20"
          >
            Começar grátis
          </Link>
          <Link
            href="#como-funciona"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg border border-brand-border text-brand-text font-semibold text-base hover:bg-brand-surface transition-all"
          >
            Ver demonstração
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-muted"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-brand-accent">&#10003;</span> Sem cartão de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-brand-accent">&#10003;</span> Setup em 10 minutos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-brand-accent">&#10003;</span> Suporte em português
          </span>
        </motion.div>
      </div>
    </section>
  );
}
