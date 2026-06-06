"use client";

import { AlertCircle } from "lucide-react";

interface AiErrorAlertProps {
  message: string;
}

export function AiErrorAlert({ message }: AiErrorAlertProps) {
  return (
    <div
      className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle
        className="h-4 w-4 text-destructive shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
