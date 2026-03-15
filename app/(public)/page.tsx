import Hero from "@/components/landing/hero";
import Problema from "@/components/landing/problema";
import Solucao from "@/components/landing/solucao";
import ComoFunciona from "@/components/landing/como-funciona";
import Numeros from "@/components/landing/numeros";
import Cooperativas from "@/components/landing/cooperativas";
import Planos from "@/components/landing/planos";
import FAQ from "@/components/landing/faq";
import CtaFinal from "@/components/landing/cta-final";
import Footer from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Problema />
      <Solucao />
      <ComoFunciona />
      <Numeros />
      <Cooperativas />
      <Planos />
      <FAQ />
      <CtaFinal />
      <Footer />
    </main>
  );
}
