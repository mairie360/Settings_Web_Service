"use client";
import { useEffect } from "react";
import { useToast } from "@mairie360/lib-components/primitives";

export interface StatusToastProps {
  /** Receipt to announce; nothing is shown while empty. */
  message: string;
  title?: string;
  tone?: "success" | "error";
  /** Called once the toast is queued, so the caller clears its message and a later identical receipt shows again. */
  onShown: () => void;
}

/**
 * Bridges a state message to the lib `ToastProvider` (top right, 5 s for a success, MAIR-851): renders nothing.
 */
export const StatusToast = ({ message, title, tone = "success", onShown }: StatusToastProps) => {
  const toast = useToast();
  useEffect(() => {
    if (!message) return;
    if (tone === "error") toast.error(message, title ? { title } : undefined);
    else toast.success(message, title ? { title } : undefined);
    onShown();
  }, [message, title, tone, toast, onShown]);
  return null;
};
