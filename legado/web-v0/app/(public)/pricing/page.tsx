import Planos from "@/components/landing/planos";
import FAQ from "@/components/landing/faq";
import CtaFinal from "@/components/landing/cta-final";
import Footer from "@/components/landing/footer";

export const metadata = {
  title: "Planos e Preços — GrãoRaiz",
  description:
    "Planos simples e acessíveis para produtores e cooperativas. Comece grátis e escale quando precisar.",
};

export default function PricingPage() {
  return (
    <main className="pt-20">
      <Planos />
      <FAQ />
      <CtaFinal />
      <Footer />
    </main>
  );
}
