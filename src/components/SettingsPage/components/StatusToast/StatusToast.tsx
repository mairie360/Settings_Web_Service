"use client";
import { useEffect, useRef } from "react";
import { useToast } from "@mairie360/lib-components/primitives";

export interface StatusToastProps {
  /** Receipt to announce; nothing is shown while empty. */
  message: string;
  title?: string;
  tone?: "success" | "error";
  /** Called once the toast is queued, so the caller clears its message and a later identical receipt shows again. */
  onShown: () => void;
  /** Closes the last toast this bridge opened (e.g. a refusal once the agent retries). */
  dismiss?: boolean;
}

/**
 * Bridges a state message to the lib `ToastProvider` (top right, 5 s for a success, MAIR-851): renders nothing.
 */
export const StatusToast = ({ message, title, tone = "success", onShown, dismiss = false }: StatusToastProps) => {
  const toast = useToast();
  const shown = useRef<string | null>(null);
  useEffect(() => {
    if (!message) return;
    if (shown.current) toast.dismiss(shown.current);
    shown.current = tone === "error" ? toast.error(message, title ? { title } : undefined) : toast.success(message, title ? { title } : undefined);
    onShown();
  }, [message, title, tone, toast, onShown]);
  useEffect(() => {
    if (dismiss && shown.current) { toast.dismiss(shown.current); shown.current = null; }
  }, [dismiss, toast]);
  return null;
};
