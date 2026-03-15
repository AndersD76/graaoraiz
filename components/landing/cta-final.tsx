"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Shield, Server, MessageCircle, ArrowRight } from "lucide-react";

export default function CtaFinal() {
  return (
    <section id="contato" className="py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl border border-brand-border overflow-hidden relative"
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1471532027614-8be04c0e5a04?w=1920&q=80"
              alt="Lavoura de grãos ao pôr do sol"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-brand-bg/90 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 p-10 sm:p-16 text-center">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-accent/8 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mx-auto mb-6"
              >
                <span className="text-brand-accent text-3xl">&#x2B21;</span>
              </motion.div>

              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4">
                Sua safra já começou.
                <br />
                <span className="text-brand-accent">
                  Sua rastreabilidade também deveria.
                </span>
              </h2>
              <p className="text-brand-muted max-w-xl mx-auto mb-10 leading-relaxed">
                Crie sua conta em 2 minutos. Sem cartão de crédito, sem contrato.
                Comece a rastrear hoje e exporte com confiança.
              </p>

              <Link
                href="/cadastro"
                className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-brand-accent text-brand-bg font-semibold text-lg hover:brightness-110 transition-all shadow-lg shadow-brand-accent/25"
              >
                Começar grátis agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}
