"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Rows3, Link2, FileDown } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MapPin,
    title: "Cadastre sua propriedade",
    desc: "Adicione sua fazenda e desenhe os talhões no mapa com GPS do celular ou coordenadas.",
    image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80",
    imageAlt: "Vista aérea de propriedade rural",
  },
  {
    num: "02",
    icon: Rows3,
    title: "Registre no campo",
    desc: "Cada plantio, aplicação e colheita vira um registro digital com data, local e responsável.",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80",
    imageAlt: "Plantio mecanizado em lavoura",
  },
  {
    num: "03",
    icon: Link2,
    title: "Vincule a entrega",
    desc: "Conecte a colheita à nota fiscal e ao romaneio da cooperativa. Rastreabilidade ponta a ponta.",
    image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&q=80",
    imageAlt: "Colheita de grãos com colheitadeira",
  },
  {
    num: "04",
    icon: FileDown,
    title: "Exporte compliance",
    desc: "Gere o dossiê EUDR em PDF ou JSON. Pronto para auditoria, pronto para exportar.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
    imageAlt: "Documentos de compliance e relatórios",
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono font-semibold px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent mb-4 uppercase tracking-wider">
            Passo a passo
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4">
            Como funciona
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto">
            Do cadastro à exportação em 4 passos simples.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl border border-brand-border bg-brand-surface overflow-hidden hover:border-brand-accent/30 transition-colors"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/40 to-transparent" />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-accent/30">
                  <span className="font-mono text-sm font-bold text-brand-bg">
                    {step.num}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <step.icon className="w-5 h-5 text-brand-accent" />
                  <h3 className="text-lg font-semibold text-brand-text">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
