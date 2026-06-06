import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WellnessProvider } from "@/features/wellness/hooks/use-wellness-store";
import { Navigation } from "@/components/shared/navigation";
import { ErrorBoundary } from "@/components/shared/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindfulU — Exam Preparation Wellness",
  description:
    "Track mood, manage exam anxiety, and receive personalized AI-powered wellness support for NEET, JEE, CUET, CAT, GATE, UPSC and other competitive exam students.",
  keywords: ["exam wellness", "student mental health", "NEET preparation", "JEE stress", "exam anxiety", "competitive exam support"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <WellnessProvider>
          <a
            href="#main-content"
            className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Skip to main content
          </a>
          <Navigation />
          <main id="main-content" className="container mx-auto px-4 py-8 max-w-5xl">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </WellnessProvider>
      </body>
    </html>
  );
}
