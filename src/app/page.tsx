import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, BookOpen, MessageCircle, BarChart3, ArrowRight, GraduationCap } from "lucide-react";

import { EXAM_DISPLAY_BADGES } from "@/lib/constants";

const FEATURES = [
  {
    icon: Brain,
    title: "Daily Mood Check-in",
    description:
      "Track how exam preparation affects your mood, energy, and anxiety every day. Tag exam stressors like mock test performance, revision pressure, and syllabus backlog.",
    href: "/mood",
    cta: "Start tracking",
  },
  {
    icon: BookOpen,
    title: "Study Reflection Journal",
    description:
      "Reflect on your preparation journey with guided prompts designed for exam students. Identify patterns in your study anxiety and emotional wellbeing.",
    href: "/journal",
    cta: "Open journal",
  },
  {
    icon: BarChart3,
    title: "Exam Readiness Dashboard",
    description:
      "See your wellness score, exam risk level, days remaining, and most frequent stress triggers. AI insights reveal hidden patterns in your preparation.",
    href: "/dashboard",
    cta: "View dashboard",
  },
  {
    icon: MessageCircle,
    title: "Exam Prep Coach",
    description:
      "Talk to your AI coach trained on exam preparation challenges — from managing mock test anxiety to overcoming syllabus backlog and peer comparison pressure.",
    href: "/chat",
    cta: "Talk to coach",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section
        className="text-center space-y-6 pt-8"
        aria-labelledby="hero-heading"
      >
        <div
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto"
          aria-hidden="true"
        >
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-3">
          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Wellness for{" "}
            <span className="text-primary">Exam Aspirants</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track mood, manage exam anxiety, reflect on your preparation
            journey, and receive AI-powered wellness support — built specifically
            for students preparing for competitive exams.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Supported exams"
        >
          {EXAM_DISPLAY_BADGES.map((exam) => (
            <span
              key={exam}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {exam}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Set Up My Exam
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/mood">Log Today&apos;s Mood</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          All data stored privately on your device. No account required.
        </p>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">
          Features
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description, href, cta }) => (
            <Card
              key={href}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div
                  className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2"
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  variant="ghost"
                  className="p-0 h-auto font-medium text-primary"
                >
                  <Link href={href} aria-label={`${cta} — ${title}`}>
                    {cta}{" "}
                    <ArrowRight
                      className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl bg-primary/5 border border-primary/10 p-8 space-y-4"
        aria-labelledby="support-heading"
      >
        <h2 id="support-heading" className="text-lg font-semibold">
          Feeling overwhelmed? You&apos;re not alone.
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          Exam pressure is real. If you are in crisis or need to speak with
          someone urgently, please reach out to a mental health professional or
          student counseling services.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="font-medium">
            iCall (India):{" "}
            <strong>9152987821</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-medium">
            Vandrevala Foundation:{" "}
            <strong>1860-2662-345</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-medium">
            Crisis Text Line:{" "}
            <strong>Text HOME to 741741</strong>
          </span>
        </div>
      </section>
    </div>
  );
}
