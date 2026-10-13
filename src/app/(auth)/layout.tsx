import { Backdrop } from "@/components/layout/Backdrop";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Backdrop />
      <SiteHeader />
      <main className="flex justify-center px-4 py-10 md:py-16">{children}</main>
    </div>
  );
}
