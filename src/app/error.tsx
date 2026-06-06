"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Page Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card
        className="max-w-md w-full border-destructive bg-destructive/5"
        role="alert"
        aria-live="assertive"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            An unexpected error occurred. Your data is safe — it&apos;s stored
            locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Return to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
