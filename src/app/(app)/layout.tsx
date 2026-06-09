import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { OnboardingWrapper } from "@/components/dashboard/OnboardingWrapper";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground relative">
        {/* Global Ethereal Glass Background Orbs */}
        <div className="absolute top-0 left-1/4 w-[50vw] h-[50vw] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-[40vw] h-[40vw] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none opacity-50"></div>

        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden z-10">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-transparent relative z-10">
            <OnboardingWrapper>
              {children}
            </OnboardingWrapper>
          </main>
        </div>
      </div>
    </CurrencyProvider>
  );
}

