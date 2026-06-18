"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick?: () => void;
  className?: string;
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed right-6 bottom-24 z-50 flex items-center justify-center",
        "w-14 h-14 rounded-full bg-[#7a0808] text-[#f4efe6] shadow-lg",
        "transition-transform active:scale-95 hover:scale-105",
        "shadow-[#7a0808]/30 shadow-[0_8px_30px_rgb(122,8,8,0.3)]",
        className
      )}
      aria-label="Add new"
    >
      <Plus className="w-8 h-8 stroke-[2]" />
    </button>
  );
}
