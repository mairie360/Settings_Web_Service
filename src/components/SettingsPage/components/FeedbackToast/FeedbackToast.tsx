"use client";
import { Toast } from "@mairie360/lib-components/primitives";

export interface FeedbackToastProps {
  /** Confirmation text; the live region stays mounted (sr-only) while empty so a later receipt is announced. */
  message: string;
  tone?: "success" | "info";
  onClose: () => void;
  "data-feedback"?: string;
}

/** A confirmed receipt shown inline under a form, announced politely and closable by Escape. */
export const FeedbackToast = ({ message, tone = "success", onClose, ...data }: FeedbackToastProps) => (
  <Toast message={message} tone={tone} {...data} className={message ? "mt-3" : "sr-only"} onClose={message ? onClose : undefined} />
);

/** A refused write, announced assertively and closable. */
export const FailureToast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <Toast message={message} tone="danger" className="mt-3" onClose={onClose} />
);
