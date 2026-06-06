import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, BookOpen, MessageCircle, BarChart3, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Mood Check-ins",
    description:
      "Track your daily mood, energy, and anxiety levels with emoji-based scales. Build a picture of your emotional patterns over time.",
    href: "/mood",
    cta: "Start tracking",
  },
  {
    icon: BookOpen,
    title: "Reflection Journal",
    description:
      "Write freely about your thoughts and experiences. Guided prompts help you identify stress triggers and process emotions.",
    href: "/journal",
    cta: "Open journal",
  },
  {
    icon: BarChart3,
    title: "Wellness Dashboard",
    description:
      "See your wellness score, trend analysis, and most frequent stress triggers. AI-powered insights surface hidden patterns.",
    href: "/dashboard",
    cta: "View dashboard",
  },
  {
    icon: MessageCircle,
    title: "Wellness Chat",
    description:
      "Talk to your AI wellness companion anytime. Get coping strategies, emotional support, and actionable advice.",
    href: "/chat",
    cta: "Start chatting",
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
          <Brain className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-3">
          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Your Student{" "}
            <span className="text-primary">Wellness Companion</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track your mood, reflect on emotions, identify stress triggers, and
            receive personalized AI-powered support — all in one private space.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg">
            <Link href="/mood">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          All data stored locally on your device. Private by design.
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
                <Button asChild variant="ghost" className="p-0 h-auto font-medium text-primary">
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
        className="rounded-2xl bg-primary/5 border border-primary/10 p-8 text-center space-y-4"
        aria-labelledby="crisis-heading"
      >
        <h2
          id="crisis-heading"
          className="text-lg font-semibold"
        >
          Need immediate support?
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          If you&apos;re in crisis or need to speak with someone urgently, please reach
          out to a mental health professional.
        </p>
        <div className="flex flex-wrap gap-3 justify-center text-sm">
          <span className="font-medium">
            Crisis Text Line:{" "}
            <strong>Text HOME to 741741</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-medium">
            SAMHSA Helpline:{" "}
            <strong>1-800-662-4357</strong>
          </span>
        </div>
      </section>
    </div>
  );
}
