import { SidebarV2 } from "@/components/v2/layout/SidebarV2";
import { HeaderV2 } from "@/components/v2/layout/HeaderV2";
import { CurrencyProvider } from "@/context/CurrencyContext";
import LumaBar from "@/components/ui/futuristic-nav";

export default function AppV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-[#000] text-[#FAFAFA] relative">
        {/* Subtle ambient glow */}
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px] pointer-events-none" />

        <SidebarV2 />

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <HeaderV2 />
          <main className="flex-1 overflow-y-auto p-4 md:p-5 pb-24 md:pb-5 relative z-10">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav — reuse existing */}
        <LumaBar />
      </div>
    </CurrencyProvider>
  );
}
