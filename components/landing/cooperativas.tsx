"use client";

import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  BarChart3,
  Landmark,
  Headphones,
} from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Users,
    title: "Gestão de associados",
    desc: "Dashboard unificado com a rastreabilidade de todos os produtores da cooperativa.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance centralizado",
    desc: "Exporte dossiês EUDR de qualquer produtor associado com um clique.",
  },
  {
    icon: BarChart3,
    title: "Relatórios agregados",
    desc: "Visão macro de área rastreada, volume por safra e status de conformidade.",
  },
  {
    icon: Landmark,
    title: "Integração com ERPs",
    desc: "API pronta para conectar com sistemas de romaneio, NFe e gestão de grãos.",
  },
  {
    icon: Headphones,
    title: "Suporte dedicado",
    desc: "Gerente de conta exclusivo, onboarding presencial e suporte prioritário por WhatsApp.",
  },
];

export default function Cooperativas() {
  return (
    <section
      id="cooperativas"
      className="py-24 sm:py-32 bg-brand-alt/50 border-y border-brand-border"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono font-semibold px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent mb-4">
            Para cooperativas
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4">
            Rastreabilidade para{" "}
            <span className="text-brand-accent">todos os seus associados.</span>
          </h2>
          <p className="text-brand-muted max-w-2xl mx-auto">
            Plano enterprise com gestão multi-produtor, relatórios consolidados e
            integração com seus sistemas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-brand-border bg-brand-surface p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center mb-4">
                <b.icon className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="font-semibold text-brand-text mb-1">{b.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link
            href="#contato"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-brand-accent text-brand-bg font-semibold hover:brightness-110 transition-all"
          >
            Falar com comercial
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
