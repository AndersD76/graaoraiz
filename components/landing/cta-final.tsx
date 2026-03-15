"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Server, MessageCircle } from "lucide-react";

export default function CtaFinal() {
  return (
    <section id="contato" className="py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl border border-brand-border bg-brand-surface p-10 sm:p-16 text-center relative overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-accent/5 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4">
              Sua safra já começou.
              <br />
              <span className="text-brand-accent">
                Sua rastreabilidade também deveria.
              </span>
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto mb-10">
              Crie sua conta em 2 minutos. Sem cartão de crédito, sem contrato.
              Comece a rastrear hoje e exporte com confiança.
            </p>

            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center px-10 py-4 rounded-lg bg-brand-accent text-brand-bg font-semibold text-lg hover:brightness-110 transition-all shadow-lg shadow-brand-accent/20"
            >
              Começar grátis agora
            </Link>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-brand-muted">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-accent" />
                Compatível com LGPD
              </span>
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-accent" />
                Dados no Brasil
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-brand-accent" />
                Suporte por WhatsApp
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
