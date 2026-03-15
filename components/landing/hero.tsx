"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Campo verde de grãos"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg/95 to-brand-bg/70" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-bg to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 backdrop-blur-sm mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent" />
              </span>
              <span className="text-sm text-brand-accent font-medium">
                EUDR entra em vigor em 2025
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-brand-text mb-6"
            >
              Rastreabilidade
              <br />
              <span className="text-brand-accent">que vale dinheiro.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-lg sm:text-xl text-brand-muted max-w-lg mb-10 leading-relaxed"
            >
              Caderneta digital de campo + inteligência de preços em tempo real.
              Compliance EUDR pronto para exportação, do talhão ao porto.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
            >
              <Link
                href="/cadastro"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand-accent text-brand-bg font-semibold text-base hover:brightness-110 transition-all shadow-lg shadow-brand-accent/25"
              >
                Começar grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#como-funciona"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-brand-border text-brand-text font-semibold text-base hover:bg-brand-surface/50 hover:border-brand-accent/30 transition-all backdrop-blur-sm"
              >
                <Play className="w-4 h-4 text-brand-accent" />
                Ver como funciona
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-muted"
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

          {/* Right side - App preview mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="rounded-2xl border border-brand-border bg-brand-surface/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  <span className="ml-2 text-xs text-brand-muted font-mono">app.graoraiz.com</span>
                </div>
                <div className="relative rounded-lg overflow-hidden">
                  <Image
                    src="/images/soybean-rows.jpg"
                    alt="Colheitadeira e trator em campo de grãos"
                    width={600}
                    height={380}
                    className="object-cover rounded-lg"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <div className="flex-1 rounded-lg bg-brand-bg/90 backdrop-blur-sm border border-brand-border p-3">
                      <p className="text-[10px] text-brand-muted uppercase tracking-wider">Soja CBOT</p>
                      <p className="text-sm font-mono font-bold text-brand-accent">R$ 134,20/sc</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-brand-bg/90 backdrop-blur-sm border border-brand-border p-3">
                      <p className="text-[10px] text-brand-muted uppercase tracking-wider">Talhões</p>
                      <p className="text-sm font-mono font-bold text-brand-text">12 ativos</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-brand-bg/90 backdrop-blur-sm border border-brand-border p-3">
                      <p className="text-[10px] text-brand-muted uppercase tracking-wider">EUDR</p>
                      <p className="text-sm font-mono font-bold text-green-400">100%</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute -bottom-6 -left-8 rounded-xl border border-brand-accent/30 bg-brand-surface/95 backdrop-blur-xl p-4 shadow-xl shadow-brand-accent/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-accent/15 flex items-center justify-center">
                    <span className="text-brand-accent text-lg">&#9889;</span>
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted">Alerta de preço</p>
                    <p className="text-sm font-semibold text-brand-text">Soja atingiu R$ 134/sc</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
