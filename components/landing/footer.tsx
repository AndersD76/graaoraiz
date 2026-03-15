import Link from "next/link";

const links = {
  Produto: [
    { label: "Caderneta de Campo", href: "#solucao" },
    { label: "Painel de Preços", href: "#solucao" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Planos", href: "#planos" },
  ],
  Empresa: [
    { label: "Sobre nós", href: "#" },
    { label: "Cooperativas", href: "#cooperativas" },
    { label: "Blog", href: "#" },
    { label: "Contato", href: "#contato" },
  ],
  Legal: [
    { label: "Termos de uso", href: "#" },
    { label: "Privacidade", href: "#" },
    { label: "LGPD", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-bg py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-brand-accent text-2xl">&#x2B21;</span>
              <span className="font-display text-xl text-brand-text">
                GrãoRaiz
              </span>
            </Link>
            <p className="text-sm text-brand-muted leading-relaxed">
              Do campo até o mercado, cada grão rastreado. Compliance EUDR +
              inteligência de preços para o agro do Sul do Brasil.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-brand-text mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-brand-muted hover:text-brand-text transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-muted">
            &copy; 2026 GrãoRaiz. Passo Fundo — RS.
          </p>
          <p className="text-xs text-brand-muted">
            Feito com cuidado para o produtor brasileiro.
          </p>
        </div>
      </div>
    </footer>
  );
}
