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
        "w-14 h-14 rounded-full bg-primary text-primary-foreground",
        "transition-all duration-200 active:scale-95 hover:scale-105",
        "shadow-[0_8px_24px_rgba(163,230,53,0.4)] hover:shadow-[0_12px_32px_rgba(163,230,53,0.5)]",
        className
      )}
      aria-label="Add new"
    >
      <Plus className="w-7 h-7 stroke-[2.5]" />
    </button>
  );
}
