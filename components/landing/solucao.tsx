"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  FileCheck,
  Layers,
  QrCode,
  Smartphone,
  Globe,
  BarChart3,
  Bell,
  TrendingUp,
  Building2,
  ArrowLeftRight,
  Zap,
} from "lucide-react";

const modules = [
  {
    badge: "Módulo 1",
    title: "Caderneta Digital de Campo",
    description:
      "Rastreabilidade geoespacial do plantio à entrega. Cada talhão mapeado, cada operação registrada.",
    color: "brand-accent",
    image: "https://images.unsplash.com/photo-1530836176759-510f58ebee44?w=800&q=80",
    imageAlt: "Produtor rural usando tablet no campo de soja",
    features: [
      { icon: MapPin, text: "Georreferenciamento de talhões com GPS" },
      { icon: FileCheck, text: "Registro digital de operações no campo" },
      { icon: Layers, text: "Vínculo talhão → colheita → entrega" },
      { icon: QrCode, text: "QR Code por lote para auditoria" },
      { icon: Smartphone, text: "Funciona offline no celular" },
      { icon: Globe, text: "Exportação compliance EUDR (PDF/JSON)" },
    ],
  },
  {
    badge: "Módulo 2",
    title: "Painel de Preços em Tempo Real",
    description:
      "Inteligência de mercado para vender no momento certo. Dados de cooperativas, CBOT e câmbio atualizados.",
    color: "brand-gold",
    image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80",
    imageAlt: "Dashboard de análise de preços e mercado",
    features: [
      { icon: BarChart3, text: "Preços de soja, milho e trigo ao vivo" },
      { icon: Bell, text: "Alertas de preço personalizados" },
      { icon: TrendingUp, text: "Comparativo entre cooperativas" },
      { icon: Building2, text: "Dados de 8+ cooperativas do RS" },
      { icon: ArrowLeftRight, text: "Spread porto vs. cooperativa" },
      { icon: Zap, text: "Atualização a cada 30 minutos" },
    ],
  },
];

export default function Solucao() {
  return (
    <section id="solucao" className="py-24 sm:py-32 bg-brand-alt/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono font-semibold px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent mb-4 uppercase tracking-wider">
            A solução
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4">
            Uma plataforma.{" "}
            <span className="text-brand-accent">Dois superpoderes.</span>
          </h2>
          <p className="text-brand-muted max-w-2xl mx-auto">
            Compliance e inteligência de mercado integrados. Tudo que o produtor
            e a cooperativa precisam, num lugar só.
          </p>
        </motion.div>

        <div className="space-y-8">
          {modules.map((mod, idx) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden"
            >
              <div className={`grid grid-cols-1 lg:grid-cols-2 ${idx % 2 === 1 ? "lg:grid-flow-dense" : ""}`}>
                <div className={`relative h-64 lg:h-auto min-h-[300px] ${idx % 2 === 1 ? "lg:col-start-2" : ""}`}>
                  <Image
                    src={mod.image}
                    alt={mod.imageAlt}
                    fill
                    className="object-cover"
                  />
                  <div className={`absolute inset-0 ${idx % 2 === 1 ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-brand-surface/30 to-transparent lg:hidden`} />
                </div>

                <div className="p-8 sm:p-10 flex flex-col justify-center">
                  <span
                    className={`inline-block w-fit text-xs font-mono font-semibold px-3 py-1 rounded-full mb-4 ${
                      mod.color === "brand-accent"
                        ? "bg-brand-accent/10 text-brand-accent"
                        : "bg-brand-gold/10 text-brand-gold"
                    }`}
                  >
                    {mod.badge}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-brand-text mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-brand-muted mb-8">{mod.description}</p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mod.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            mod.color === "brand-accent"
                              ? "bg-brand-accent/10"
                              : "bg-brand-gold/10"
                          }`}
                        >
                          <f.icon
                            className={`w-4 h-4 ${
                              mod.color === "brand-accent"
                                ? "text-brand-accent"
                                : "text-brand-gold"
                            }`}
                          />
                        </div>
                        <span className="text-sm text-brand-text">{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
