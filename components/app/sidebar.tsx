"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  Layers,
  SprayCan,
  FileText,
  BarChart3,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  {
    label: "Rastreabilidade",
    icon: Map,
    children: [
      { label: "Talhões", href: "/rastreabilidade", icon: Layers },
      { label: "Aplicações", href: "/rastreabilidade/aplicacoes", icon: SprayCan },
      { label: "Relatórios", href: "/relatorios", icon: FileText },
    ],
  },
  {
    label: "Mercado",
    icon: BarChart3,
    children: [
      { label: "Preços", href: "/mercado", icon: BarChart3 },
      { label: "Alertas", href: "/mercado/alertas", icon: Bell },
    ],
  },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar({ open, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-surface border-r border-brand-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-brand-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-brand-accent text-2xl">⬡</span>
            <span className="font-display text-xl text-brand-text">
              GrãoRaiz
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-brand-muted"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) =>
            item.children ? (
              <NavGroup
                key={item.label}
                item={item}
                pathname={pathname}
                onClose={onClose}
              />
            ) : (
              <NavLink
                key={item.href}
                href={item.href!}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href}
                onClick={onClose}
              />
            )
          )}
        </nav>

        <div className="border-t border-brand-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-dim flex items-center justify-center text-brand-text text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text truncate">
                {user?.name || "Usuário"}
              </p>
              <p className="text-xs text-brand-muted truncate">
                {user?.email || ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-brand-muted hover:text-red-400"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-brand-accent/10 text-brand-accent"
          : "text-brand-muted hover:text-brand-text hover:bg-brand-alt"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  onClose,
}: {
  item: (typeof navItems)[number];
  pathname: string;
  onClose: () => void;
}) {
  const isActive = item.children?.some((c) => pathname.startsWith(c.href));
  const Icon = item.icon;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
          isActive ? "text-brand-accent" : "text-brand-muted"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isActive && "rotate-180"
          )}
        />
      </div>
      <div className="ml-7 space-y-1 mt-1">
        {item.children?.map((child) => (
          <NavLink
            key={child.href}
            href={child.href}
            icon={child.icon}
            label={child.label}
            active={pathname === child.href || pathname.startsWith(child.href + "/")}
            onClick={onClose}
          />
        ))}
      </div>
    </div>
  );
}
