"use client";

import { Menu, Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

interface HeaderProps {
  onMenuClick: () => void;
}

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/rastreabilidade": "Talhões",
  "/rastreabilidade/novo": "Novo Talhão",
  "/rastreabilidade/aplicacoes": "Aplicações",
  "/mercado": "Preços de Mercado",
  "/mercado/alertas": "Alertas",
  "/relatorios": "Relatórios EUDR",
  "/configuracoes": "Configurações",
};

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const getBreadcrumb = () => {
    for (const [path, label] of Object.entries(breadcrumbMap)) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        return label;
      }
    }
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-brand-border bg-brand-bg/80 backdrop-blur-sm px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-brand-muted"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <h1 className="text-lg font-medium text-brand-text">
          {getBreadcrumb()}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-brand-muted hover:text-brand-text"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand-accent text-[10px] font-bold text-brand-bg flex items-center justify-center">
            3
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-brand-muted hover:text-brand-text"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
