"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ShieldAlert, FileX, TrendingDown } from "lucide-react";

const cards = [
  {
    icon: ShieldAlert,
    title: "Bloqueio na exportação",
    desc: "A partir de dez/2025, a UE exige prova de que sua soja não veio de área desmatada. Sem compliance, sem venda.",
    image: "/images/grain-silo.jpg",
    imageAlt: "Porto de exportação de grãos",
  },
  {
    icon: FileX,
    title: "Cadernos de papel",
    desc: "Planilhas e cadernetas manuais não geram rastreabilidade verificável. Auditores rejeitam documentação analógica.",
    image: "/images/grain-closeup.jpg",
    imageAlt: "Documentos e papéis desorganizados",
  },
  {
    icon: TrendingDown,
    title: "Prejuízo invisível",
    desc: "Sem dados de mercado em tempo real, produtores vendem na baixa e perdem milhares por safra sem perceber.",
    image: "/images/wheat-golden.jpg",
    imageAlt: "Gráfico de mercado financeiro",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15 },
  }),
};

export default function Problema() {
  return (
    <section id="problema" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <span className="inline-block text-xs font-mono font-semibold px-3 py-1 rounded-full bg-red-400/10 text-red-400 mb-4 uppercase tracking-wider">
            O problema
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text text-center mb-4"
        >
          A UE vai barrar sua soja{" "}
          <span className="text-red-400">sem rastreabilidade.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-brand-muted text-center max-w-2xl mx-auto mb-16"
        >
          O Regulamento de Desmatamento da União Europeia (EUDR) muda tudo.
          Quem não se adaptar perde acesso ao maior mercado do mundo.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden hover:border-red-400/40 transition-colors group"
            >
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/50 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <div className="w-10 h-10 rounded-lg bg-red-400/20 backdrop-blur-sm flex items-center justify-center">
                    <card.icon className="w-5 h-5 text-red-400" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-brand-text mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-6 sm:p-8 max-w-3xl mx-auto"
        >
          <div className="flex gap-4">
            <span className="text-brand-gold text-3xl leading-none shrink-0">&ldquo;</span>
            <div>
              <p className="text-brand-muted italic text-sm leading-relaxed">
                Operadores e comerciantes devem garantir que os produtos
                colocados no mercado da UE não provêm de terras desmatadas após 31
                de dezembro de 2020.
              </p>
              <footer className="mt-3 text-xs text-brand-gold font-mono">
                — Regulamento (UE) 2023/1115, Art. 3
              </footer>
            </div>
          </div>
        </motion.blockquote>
      </div>
    </section>
  );
}
