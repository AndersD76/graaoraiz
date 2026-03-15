"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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

const testimonials = [
  {
    quote: "O GrãoRaiz simplificou toda a rastreabilidade dos nossos associados. Agora geramos o dossiê EUDR em minutos.",
    name: "Carlos Menegat",
    role: "Diretor de Operações",
    coop: "Cooperativa Agrícola",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
  },
  {
    quote: "Com o painel de preços, nossos produtores pararam de vender na baixa. O ganho médio por saca aumentou significativamente.",
    name: "Ana Paula Ferreira",
    role: "Coordenadora Comercial",
    coop: "Cooperativa Tritícola",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
  },
];

export default function Cooperativas() {
  return (
    <section
      id="cooperativas"
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1920&q=80"
          alt="Silos de armazenamento de grãos em cooperativa"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-bg/95" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono font-semibold px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent mb-4 uppercase tracking-wider">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-brand-border bg-brand-surface/80 backdrop-blur-sm p-6 hover:border-brand-accent/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center mb-4 group-hover:bg-brand-accent/20 transition-colors">
                <b.icon className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="font-semibold text-brand-text mb-1">{b.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
              className="rounded-xl border border-brand-border bg-brand-surface/60 backdrop-blur-sm p-6"
            >
              <p className="text-brand-muted text-sm leading-relaxed italic mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-brand-accent/30">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-text">{t.name}</p>
                  <p className="text-xs text-brand-muted">{t.role} — {t.coop}</p>
                </div>
              </div>
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
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-accent text-brand-bg font-semibold hover:brightness-110 transition-all shadow-lg shadow-brand-accent/20"
          >
            Falar com comercial
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
