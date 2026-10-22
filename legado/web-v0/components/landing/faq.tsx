"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "O que é a EUDR e como afeta minha propriedade?",
    a: "A EUDR (EU Deforestation Regulation) é o regulamento europeu que exige prova de que commodities como soja, café e cacau não vêm de áreas desmatadas após dezembro de 2020. Se você exporta — direta ou indiretamente via cooperativa — precisa de rastreabilidade geoespacial. O GrãoRaiz gera toda a documentação necessária automaticamente.",
  },
  {
    q: "Preciso de equipamento especial para o georreferenciamento?",
    a: "Não. O GrãoRaiz usa o GPS do seu próprio celular para mapear os talhões. Basta caminhar pelo perímetro ou marcar os pontos no mapa. A precisão do GPS de smartphone já atende os requisitos da EUDR.",
  },
  {
    q: "A plataforma funciona offline?",
    a: "Sim. Você pode registrar operações de campo, marcar pontos GPS e preencher a caderneta mesmo sem internet. Quando o sinal voltar, tudo sincroniza automaticamente.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Absolutamente. Todos os dados são criptografados em trânsito e em repouso, armazenados em servidores no Brasil (São Paulo). Somos compatíveis com a LGPD e você é dono dos seus dados — pode exportar ou excluir a qualquer momento.",
  },
  {
    q: "O GrãoRaiz integra com o sistema da minha cooperativa?",
    a: "Sim. O plano Pro inclui acesso à nossa API REST para integração com ERPs, sistemas de romaneio e emissão de NFe. Também oferecemos integrações prontas para os principais sistemas do agro.",
  },
  {
    q: "Tem contrato de fidelidade?",
    a: "Não. Todos os planos são mensais e você pode cancelar a qualquer momento, sem multa. No plano gratuito, você usa por tempo indeterminado sem pagar nada.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-brand-muted">
            Tudo que você precisa saber antes de começar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-xl border border-brand-border bg-brand-surface px-6 !border-b"
              >
                <AccordionTrigger className="py-5 text-left text-brand-text hover:no-underline text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-brand-muted leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
