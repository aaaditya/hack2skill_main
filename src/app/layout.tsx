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
  title: "MindfulU — Student Wellness Companion",
  description:
    "Track your mood, reflect on emotions, identify stress triggers, and receive personalized wellness support powered by AI.",
  keywords: ["student wellness", "mental health", "mood tracking", "stress management"],
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
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
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
