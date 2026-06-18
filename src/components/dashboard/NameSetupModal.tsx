"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";

interface NameSetupModalProps {
  onComplete: (firstName: string) => void;
}

export function NameSetupModal({ onComplete }: NameSetupModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        onComplete(firstName.trim());
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden text-foreground"
      >
        {/* Header */}
        <div className="bg-secondary/30 p-6 border-b border-border flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome to FINORA</h2>
              <p className="text-muted-foreground text-xs mt-0.5">Let&apos;s set up your profile name</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">First Name</label>
            <input
              type="text"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              placeholder="e.g. John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Last Name</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              placeholder="e.g. Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Actions */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-11 bg-primary hover:bg-primary text-white font-semibold flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Continue to Dashboard
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
