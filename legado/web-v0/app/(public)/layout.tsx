import Navbar from "@/components/landing/navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Navbar />
      {children}
    </div>
  );
}
