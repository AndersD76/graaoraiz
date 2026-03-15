"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  prefix: string;
  label: string;
}

const stats: Stat[] = [
  { value: 342, suffix: " ha", prefix: "", label: "Hectares rastreados" },
  { value: 2.3, suffix: "/sc", prefix: "R$ ", label: "Economia média por saca" },
  { value: 87, suffix: "%", prefix: "", label: "Redução de tempo em compliance" },
  { value: 47, suffix: " dias", prefix: "", label: "Tempo médio até compliance total" },
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
    <span className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-brand-accent">
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
    <section className="py-24 sm:py-32">
      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text">
            Números que comprovam
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                started={inView}
              />
              <p className="mt-2 text-sm text-brand-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
