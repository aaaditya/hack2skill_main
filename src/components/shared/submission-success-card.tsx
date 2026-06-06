"use client";

import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SubmissionSuccessCardProps {
  heading: string;
  message: string;
}

export function SubmissionSuccessCard({ heading, message }: SubmissionSuccessCardProps) {
  return (
    <Card className="border-green-200 bg-green-50" role="status" aria-live="polite">
      <CardContent className="flex flex-col items-center gap-3 py-12">
        <CheckCircle className="h-12 w-12 text-green-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-green-800">{heading}</h2>
        <p className="text-sm text-green-700">{message}</p>
      </CardContent>
    </Card>
  );
}
