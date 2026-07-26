import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { GlobalPermissionHandler } from "@/components/global/GlobalPermissionHandler";
import { NavigationProvider } from "@/components/layout/NavigationProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <NavigationProvider>
        <GlobalPermissionHandler />
        <div className="flex h-screen overflow-hidden bg-background text-foreground relative">
          {/* === Ambient Background Layers === */}
          {/* Blue radial glow — top left */}
          <div className="absolute top-0 left-0 w-[60vw] h-[60vh] pointer-events-none" style={{background: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.07) 0%, transparent 65%)'}} />
          {/* Maroon brand glow — bottom right */}
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] pointer-events-none" style={{background: 'radial-gradient(ellipse at bottom right, rgba(129,1,0,0.06) 0%, transparent 65%)'}} />
          {/* Teal accent — mid right */}
          <div className="absolute top-1/3 right-0 w-[30vw] h-[40vh] pointer-events-none" style={{background: 'radial-gradient(ellipse at right, rgba(20,184,166,0.04) 0%, transparent 65%)'}} />

          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden z-10">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-transparent relative z-10">
              {children}
            </main>
          </div>
        </div>
      </NavigationProvider>
    </CurrencyProvider>
  );
}
