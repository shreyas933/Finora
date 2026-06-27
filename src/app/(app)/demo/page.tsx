"use client";

import LumaBar from "@/components/ui/futuristic-nav";

export default function DemoOne() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-4">Futuristic Nav Demo</h1>
      <p className="text-muted-foreground mb-8">
        The navigation bar is fixed to the bottom of the screen.
      </p>
      
      {/* The component itself */}
      <LumaBar />
    </div>
  );
}
