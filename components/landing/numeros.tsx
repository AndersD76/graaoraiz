"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Sprout, PiggyBank, Clock, CalendarCheck } from "lucide-react";

interface Stat {
  value: number;
  suffix: string;
  prefix: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const stats: Stat[] = [
  {
    value: 342,
    suffix: " ha",
    prefix: "",
    label: "Hectares rastreados",
    description: "Área total com rastreabilidade completa na plataforma",
    icon: Sprout,
  },
  {
    value: 2.3,
    suffix: "/sc",
    prefix: "R$ ",
    label: "Economia média por saca",
    description: "Ganho médio dos produtores com inteligência de preços",
    icon: PiggyBank,
  },
  {
    value: 87,
    suffix: "%",
    prefix: "",
    label: "Redução de tempo",
    description: "Menos tempo gasto com documentação de compliance",
    icon: Clock,
  },
  {
    value: 47,
    suffix: " dias",
    prefix: "",
    label: "Até compliance total",
    description: "Tempo médio para atingir conformidade EUDR completa",
    icon: CalendarCheck,
  },
];

function AnimatedCounter({
  value,
  prefix,
  suffix,
  started,
}: {
  value: number;
  prefix: string;
  suffix: string;
  started: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!started) return;
    const isDecimal = value % 1 !== 0;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, increment * step);
      setDisplay(isDecimal ? parseFloat(current.toFixed(2)) : Math.round(current));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [started, value]);

  const formatted = value % 1 !== 0 ? display.toFixed(2).replace(".", ",") : display;

  return (
    <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold text-brand-accent">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default function Numeros() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/corn-field.jpg"
          alt="Campo de trigo ao amanhecer"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-bg/92" />
      </div>

      <div ref={ref} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono font-semibold px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold mb-4 uppercase tracking-wider">
            Resultados reais
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text">
            Números que comprovam
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto mt-4">
            Dados agregados de produtores que já usam o GrãoRaiz no Sul do Brasil.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-brand-border bg-brand-surface/80 backdrop-blur-sm p-6 text-center hover:border-brand-accent/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-accent/20 transition-colors">
                <stat.icon className="w-6 h-6 text-brand-accent" />
              </div>
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                started={inView}
              />
              <p className="mt-2 text-sm font-semibold text-brand-text">{stat.label}</p>
              <p className="mt-1 text-xs text-brand-muted leading-relaxed">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
