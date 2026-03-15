"use client";

import { useState } from "react";
import {
  BookOpen,
  Map,
  BarChart3,
  FileText,
  HelpCircle,
  Sprout,
  Shield,
  Bell,
  Calculator,
  MapPin,
  Layers,
  SprayCan,
  Truck,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Download,
  Globe,
  Wifi,
  Lock,
  CreditCard,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface StepProps {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function Step({ number, icon: Icon, title, description }: StepProps) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-accent/15 text-brand-accent text-sm font-bold shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-brand-accent shrink-0" />
          <h4 className="text-sm font-semibold text-brand-text">{title}</h4>
        </div>
        <p className="text-sm text-brand-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

interface SectionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  sectionId: string;
  steps: StepProps[];
  activeSection: string;
  onToggle: (id: string) => void;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  sectionId,
  steps,
  activeSection,
  onToggle,
}: SectionCardProps) {
  return (
    <Card className="bg-brand-surface border-brand-border">
      <CardHeader
        className="cursor-pointer group"
        onClick={() => onToggle(sectionId)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-accent/10">
            <Icon className="h-5 w-5 text-brand-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-brand-text text-base">{title}</CardTitle>
            <p className="text-xs text-brand-muted mt-0.5">{description}</p>
          </div>
          <ChevronRight
            className={`h-4 w-4 text-brand-muted transition-transform duration-200 ${
              activeSection === sectionId ? "rotate-90" : ""
            }`}
          />
        </div>
      </CardHeader>
      {activeSection === sectionId && (
        <CardContent className="pt-0 border-t border-brand-border">
          <div className="divide-y divide-brand-border">
            {steps.map((step) => (
              <Step key={step.number} {...step} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

const sections = [
  {
    id: "primeiros-passos",
    icon: Sprout,
    title: "Primeiros Passos",
    description: "Cadastro, propriedade e navegacao basica",
    steps: [
      {
        number: 1,
        icon: MapPin,
        title: "Como cadastrar sua propriedade",
        description:
          "Ao acessar o app pela primeira vez, voce sera guiado para cadastrar sua propriedade. Informe o nome da fazenda, localizacao (municipio/estado) e a area total em hectares. Esses dados serao usados para gerar seus relatorios EUDR.",
      },
      {
        number: 2,
        icon: Layers,
        title: "Como adicionar seus talhoes no mapa",
        description:
          'Acesse "Rastreabilidade > Talhoes" no menu lateral. Clique em "Novo Talhao" e desenhe o perimetro diretamente no mapa interativo. Voce pode nomear cada talhao e informar a cultura plantada. O sistema calcula a area automaticamente.',
      },
      {
        number: 3,
        icon: Map,
        title: "Como navegar pelo app",
        description:
          "Use o menu lateral para acessar as principais secoes: Dashboard (visao geral), Rastreabilidade (talhoes, aplicacoes, relatorios), Mercado (precos e alertas) e Configuracoes. No celular, toque no icone de menu no topo da tela.",
      },
    ],
  },
  {
    id: "rastreabilidade",
    icon: Shield,
    title: "Rastreabilidade",
    description: "Aplicacoes, entregas, notas fiscais e compliance",
    steps: [
      {
        number: 1,
        icon: SprayCan,
        title: "Como registrar aplicacoes de defensivos",
        description:
          'Acesse "Rastreabilidade > Aplicacoes" e clique em "Nova Aplicacao". Selecione o talhao, o produto utilizado, a dose e a data. Esses registros alimentam seu score de compliance e sao essenciais para o relatorio EUDR.',
      },
      {
        number: 2,
        icon: Truck,
        title: "Como registrar entregas/lotes",
        description:
          "Na secao de Rastreabilidade, voce pode registrar cada entrega de graos vinculando-a a um talhao especifico. Informe a quantidade, data e destino (cooperativa/trading). Isso garante a rastreabilidade de origem do produto.",
      },
      {
        number: 3,
        icon: Receipt,
        title: "Como vincular NF-e e ticket de balanca",
        description:
          "Apos registrar uma entrega, voce pode anexar o numero da Nota Fiscal Eletronica (NF-e) e o ticket de balanca. Esses documentos comprovam a transacao e sao exportados junto ao relatorio EUDR.",
      },
      {
        number: 4,
        icon: ShieldCheck,
        title: "O que e o score de compliance EUDR",
        description:
          "O score de compliance indica o quanto sua propriedade esta preparada para atender ao regulamento EUDR. Ele considera: talhoes georreferenciados, aplicacoes registradas, lotes vinculados a NF-e e relatorios gerados. Quanto maior, melhor sua posicao frente as tradings.",
      },
    ],
  },
  {
    id: "mercado",
    icon: BarChart3,
    title: "Mercado",
    description: "Precos, cotacoes, calculadora e alertas",
    steps: [
      {
        number: 1,
        icon: TrendingUp,
        title: "Como consultar precos das cooperativas",
        description:
          'Acesse "Mercado > Precos" para ver os precos atualizados das principais cooperativas da sua regiao. Os valores sao atualizados diariamente e voce pode comparar entre diferentes compradores.',
      },
      {
        number: 2,
        icon: Globe,
        title: "Como funciona a cotacao CBOT",
        description:
          "O app exibe a cotacao da CBOT (Chicago Board of Trade) em tempo real, convertida para reais por saca. Voce acompanha a tendencia do mercado internacional diretamente no seu dashboard.",
      },
      {
        number: 3,
        icon: Calculator,
        title: "Como usar a calculadora de venda",
        description:
          "A calculadora de venda permite simular o valor total de uma venda informando a quantidade de sacas e o preco por saca. Ela tambem estima os custos de frete e descontos de umidade/impureza para voce ter o valor liquido.",
      },
      {
        number: 4,
        icon: Bell,
        title: "Como criar alertas de preco",
        description:
          'Acesse "Mercado > Alertas" e defina um preco-alvo. Quando a soja atingir esse valor em qualquer cooperativa monitorada, voce recebera uma notificacao. Voce pode criar multiplos alertas para diferentes faixas de preco.',
      },
    ],
  },
  {
    id: "relatorios",
    icon: FileText,
    title: "Relatorios EUDR",
    description: "Geracao, exportacao e o que as tradings precisam",
    steps: [
      {
        number: 1,
        icon: Globe,
        title: "O que e o EUDR e por que importa",
        description:
          "O EUDR (European Union Deforestation Regulation) e o regulamento europeu que exige comprovacao de que produtos agropecuarios nao provem de areas desmatadas apos dezembro de 2020. Produtores que exportam para a UE (direta ou indiretamente via tradings) precisam estar em conformidade.",
      },
      {
        number: 2,
        icon: FileText,
        title: "Como gerar seu relatorio",
        description:
          'Acesse "Rastreabilidade > Relatorios" e clique em "Gerar Relatorio EUDR". O sistema compila automaticamente os dados dos seus talhoes, aplicacoes e entregas em um documento padronizado. Revise os dados antes de finalizar.',
      },
      {
        number: 3,
        icon: Download,
        title: "Como exportar em PDF ou JSON",
        description:
          "Apos gerar o relatorio, voce pode exporta-lo em dois formatos: PDF (para apresentar a compradores e consultorias) ou JSON (formato tecnico exigido por algumas plataformas de due diligence das tradings).",
      },
      {
        number: 4,
        icon: Shield,
        title: "O que as tradings precisam",
        description:
          "As tradings exigem: coordenadas GPS dos talhoes de origem, data de producao, comprovacao de nao-desmatamento (cruzamento com mapas satelite), historico de aplicacoes e documentacao fiscal. O GraoRaiz gera tudo isso automaticamente.",
      },
    ],
  },
];

const faqItems = [
  {
    value: "item-1",
    icon: Wifi,
    question: "Preciso de internet no campo?",
    answer:
      "Nao necessariamente. O app funciona offline para funcoes basicas como registro de aplicacoes e consulta de talhoes. Quando voce voltar a ter conexao, os dados sao sincronizados automaticamente. Para cotacoes em tempo real e exportacao de relatorios, e necessario estar conectado.",
  },
  {
    value: "item-2",
    icon: Lock,
    question: "Meus dados estao seguros?",
    answer:
      "Sim. Todos os dados sao criptografados em transito (HTTPS/TLS) e em repouso. Utilizamos servidores seguros com backups diarios. Seus dados de propriedade e producao sao privados e nunca sao compartilhados com terceiros sem sua autorizacao explicita.",
  },
  {
    value: "item-3",
    icon: CreditCard,
    question: "Como funciona o plano gratuito?",
    answer:
      "O plano gratuito inclui: cadastro de ate 5 talhoes, registro ilimitado de aplicacoes, consulta de precos e geracao de 1 relatorio EUDR por mes. Para funcionalidades avancadas como alertas de preco, exportacao JSON e talhoes ilimitados, confira nossos planos pagos.",
  },
  {
    value: "item-4",
    icon: MessageCircle,
    question: "Como entro em contato com suporte?",
    answer:
      'Voce pode entrar em contato pelo WhatsApp clicando no botao "Falar com Suporte" abaixo, ou enviar um email para suporte@graoraiz.com.br. Nosso horario de atendimento e de segunda a sexta, das 8h as 18h. Chamados urgentes sao respondidos em ate 2 horas.',
  },
];

export default function AjudaPage() {
  const [activeSection, setActiveSection] = useState<string>("");

  function handleToggle(id: string) {
    setActiveSection((prev) => (prev === id ? "" : id));
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brand-accent/10">
            <BookOpen className="h-6 w-6 text-brand-accent" />
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-brand-text">
          Guia de Uso
        </h1>
        <p className="text-brand-muted text-sm">
          Aprenda a usar todas as funcionalidades do GraoRaiz passo a passo.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            icon={section.icon}
            title={section.title}
            description={section.description}
            sectionId={section.id}
            steps={section.steps}
            activeSection={activeSection}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* FAQ */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-accent/10">
              <HelpCircle className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <CardTitle className="text-brand-text text-base">
                Duvidas Frequentes
              </CardTitle>
              <p className="text-xs text-brand-muted mt-0.5">
                Respostas rapidas para as perguntas mais comuns
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible>
            {faqItems.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className="border-brand-border"
              >
                <AccordionTrigger className="text-brand-text hover:no-underline hover:text-brand-accent">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-brand-muted shrink-0" />
                    <span className="text-left">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-brand-muted leading-relaxed pl-7">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* WhatsApp Support CTA */}
      <Card className="bg-brand-accent/5 border-brand-accent/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-accent/15 shrink-0">
              <MessageCircle className="h-6 w-6 text-brand-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-brand-text">
                Precisa de ajuda?
              </h3>
              <p className="text-sm text-brand-muted mt-0.5">
                Fale diretamente com nosso time de suporte pelo WhatsApp.
              </p>
            </div>
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-accent text-brand-bg font-medium text-sm hover:bg-brand-accent/90 transition-colors shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com Suporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
