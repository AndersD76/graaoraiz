"use client";

import { motion } from "framer-motion";
import { MapPin, Rows3, Link2, FileDown } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MapPin,
    title: "Cadastre sua propriedade",
    desc: "Adicione sua fazenda e desenhe os talhões no mapa com GPS do celular ou coordenadas.",
  },
  {
    num: "02",
    icon: Rows3,
    title: "Registre no campo",
    desc: "Cada plantio, aplicação e colheita vira um registro digital com data, local e responsável.",
  },
  {
    num: "03",
    icon: Link2,
    title: "Vincule a entrega",
    desc: "Conecte a colheita à nota fiscal e ao romaneio da cooperativa. Rastreabilidade ponta a ponta.",
  },
  {
    num: "04",
    icon: FileDown,
    title: "Exporte compliance",
    desc: "Gere o dossiê EUDR em PDF ou JSON. Pronto para auditoria, pronto para exportar.",
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4">
            Como funciona
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto">
            Do cadastro à exportação em 4 passos simples.
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-brand-border hidden sm:block" />

          <div className="space-y-12 sm:space-y-16">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex flex-col sm:flex-row items-start gap-6 ${
                  i % 2 === 1 ? "sm:flex-row-reverse" : ""
                }`}
              >
                {/* Number circle */}
                <div className="hidden sm:flex absolute left-6 md:left-1/2 md:-translate-x-1/2 w-12 h-12 rounded-full bg-brand-surface border-2 border-brand-accent items-center justify-center z-10">
                  <span className="font-mono text-sm font-bold text-brand-accent">
                    {step.num}
                  </span>
                </div>

                {/* Card */}
                <div
                  className={`sm:w-[calc(50%-3rem)] ${
                    i % 2 === 0 ? "sm:ml-auto sm:pl-12 md:pl-0 md:pr-12 md:ml-0 md:mr-auto" : "sm:mr-auto sm:pr-12 md:pr-0 md:pl-12 md:mr-0 md:ml-auto"
                  }`}
                >
                  <div className="rounded-xl border border-brand-border bg-brand-surface p-6 hover:border-brand-accent/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="sm:hidden w-10 h-10 rounded-full bg-brand-surface border-2 border-brand-accent flex items-center justify-center">
                        <span className="font-mono text-xs font-bold text-brand-accent">
                          {step.num}
                        </span>
                      </div>
                      <step.icon className="w-5 h-5 text-brand-accent" />
                      <h3 className="text-lg font-semibold text-brand-text">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
