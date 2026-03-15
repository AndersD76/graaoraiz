"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { Sidebar } from "@/components/app/sidebar";
import { Header } from "@/components/app/header";
import { Providers } from "@/components/app/providers";

function OnboardingBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pathname === "/onboarding" || dismissed) return;

    const alreadyDismissed = sessionStorage.getItem("onboarding-banner-dismissed");
    if (alreadyDismissed) {
      setDismissed(true);
      return;
    }

    fetch("/api/propriedade")
      .then((res) => res.json())
      .then((data) => {
        if (!data.propriedade) {
          setShow(true);
        }
      })
      .catch(() => {});
  }, [pathname, dismissed]);

  if (!show || dismissed || pathname === "/onboarding") return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-brand-border bg-brand-alt px-4 py-2.5 text-sm">
      <p className="text-brand-text">
        Complete a configuração da sua conta.{" "}
        <Link href="/onboarding" className="font-medium text-brand-accent underline underline-offset-2 hover:text-brand-accent/80">
          Iniciar onboarding
        </Link>
      </p>
      <button
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem("onboarding-banner-dismissed", "1");
        }}
        className="shrink-0 rounded p-0.5 text-brand-muted hover:text-brand-text"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="text-brand-accent text-4xl animate-pulse">⬡</span>
          <p className="text-brand-muted text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-brand-bg">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={session?.user}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <OnboardingBanner />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
