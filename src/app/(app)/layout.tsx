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
          {/* Subtle ambient glow orbs for light mode */}
          <div className="absolute top-[-10%] left-[15%] w-[40vw] h-[40vw] bg-primary/[0.08] rounded-full blur-[150px] pointer-events-none"></div>
          <div className="absolute bottom-[-5%] right-[10%] w-[35vw] h-[35vw] bg-blue-500/[0.05] rounded-full blur-[180px] pointer-events-none"></div>

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
