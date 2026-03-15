"use client";

import { motion } from "framer-motion";
import { Check, Star, Building2 } from "lucide-react";
import Link from "next/link";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  popular?: boolean;
  enterprise?: boolean;
  cta: string;
  href: string;
  features: string[];
}

const plans: Plan[] = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Para conhecer a plataforma e começar a rastrear.",
    cta: "Começar grátis",
    href: "/cadastro",
    features: [
      "1 propriedade",
      "Até 5 talhões",
      "Caderneta digital básica",
      "Painel de preços (atrasado 1h)",
      "Exportação PDF simples",
      "Suporte por email",
    ],
  },
  {
    name: "Básico",
    price: "R$ 49",
    period: "/mês",
    description: "Para o produtor que quer compliance completo.",
    cta: "Assinar Básico",
    href: "/cadastro?plano=basico",
    features: [
      "Até 3 propriedades",
      "Talhões ilimitados",
      "Caderneta completa com GPS",
      "Painel de preços em tempo real",
      "Alertas de preço por WhatsApp",
      "Exportação EUDR (PDF + JSON)",
      "QR Code por lote",
      "Suporte por WhatsApp",
    ],
  },
  {
    name: "Pro",
    price: "R$ 99",
    period: "/mês",
    description: "Para quem exporta e precisa de compliance total.",
    popular: true,
    cta: "Assinar Pro",
    href: "/cadastro?plano=pro",
    features: [
      "Propriedades ilimitadas",
      "Talhões ilimitados",
      "Tudo do Básico +",
      "Relatórios avançados de compliance",
      "Histórico completo de operações",
      "Integração com ERPs (API)",
      "Multi-usuário por propriedade",
      "Suporte prioritário por WhatsApp",
      "Onboarding assistido",
    ],
  },
  {
    name: "Cooperativa",
    price: "Sob consulta",
    period: "",
    description: "Para cooperativas que gerenciam múltiplos produtores.",
    enterprise: true,
    cta: "Falar com comercial",
    href: "/cadastro?plano=cooperativa",
    features: [
      "Tudo do Pro +",
      "Painel multi-produtor consolidado",
      "Gestão de associados ilimitados",
      "Relatórios EUDR consolidados",
      "Whitelabel (logo e cores da cooperativa)",
      "Integração com ERP da cooperativa",
      "API completa de dados",
      "Dashboard gerencial por região",
      "Alertas de preço em massa",
      "Suporte dedicado com SLA",
      "Treinamento presencial da equipe",
    ],
  },
];

export default function Planos() {
  return (
    <section id="planos" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4">
            Planos simples, sem surpresas
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto">
            Comece grátis. Escale quando precisar. Cancele quando quiser.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.popular
                  ? "border-brand-accent bg-brand-surface shadow-lg shadow-brand-accent/10 scale-[1.02]"
                  : plan.enterprise
                  ? "border-brand-gold bg-brand-surface shadow-lg shadow-brand-gold/10"
                  : "border-brand-border bg-brand-surface"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-brand-accent text-brand-bg">
                    <Star className="w-3 h-3" /> Mais popular
                  </span>
                </div>
              )}
              {plan.enterprise && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-brand-gold text-brand-bg">
                    <Building2 className="w-3 h-3" /> Para cooperativas
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-brand-text mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-brand-muted mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold text-brand-text">
                    {plan.price}
                  </span>
                  <span className="text-sm text-brand-muted">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
                    <span className="text-sm text-brand-muted">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full inline-flex items-center justify-center py-3 rounded-lg font-semibold text-sm transition-all ${
                  plan.popular
                    ? "bg-brand-accent text-brand-bg hover:brightness-110 shadow-lg shadow-brand-accent/20"
                    : plan.enterprise
                    ? "bg-brand-gold text-brand-bg hover:brightness-110 shadow-lg shadow-brand-gold/20"
                    : "border border-brand-border text-brand-text hover:bg-brand-surface hover:border-brand-accent/40"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
