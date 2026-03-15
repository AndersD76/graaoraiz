"use client";

import { motion } from "framer-motion";
import { ShieldAlert, FileX, TrendingDown } from "lucide-react";

const cards = [
  {
    icon: ShieldAlert,
    title: "Bloqueio na exportação",
    desc: "A partir de dez/2025, a UE exige prova de que sua soja não veio de área desmatada. Sem compliance, sem venda.",
  },
  {
    icon: FileX,
    title: "Cadernos de papel",
    desc: "Planilhas e cadernetas manuais não geram rastreabilidade verificável. Auditores rejeitam documentação analógica.",
  },
  {
    icon: TrendingDown,
    title: "Prejuízo invisível",
    desc: "Sem dados de mercado em tempo real, produtores vendem na baixa e perdem milhares por safra sem perceber.",
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
              className="rounded-xl border border-brand-border bg-brand-surface p-8 hover:border-red-400/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-red-400/10 flex items-center justify-center mb-5">
                <card.icon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* EUDR quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 border-l-2 border-brand-gold pl-6 max-w-3xl mx-auto"
        >
          <p className="text-brand-muted italic text-sm leading-relaxed">
            &ldquo;Operadores e comerciantes devem garantir que os produtos
            colocados no mercado da UE não provêm de terras desmatadas após 31
            de dezembro de 2020.&rdquo;
          </p>
          <footer className="mt-3 text-xs text-brand-gold font-mono">
            — Regulamento (UE) 2023/1115, Art. 3
          </footer>
        </motion.blockquote>
      </div>
    </section>
  );
}
