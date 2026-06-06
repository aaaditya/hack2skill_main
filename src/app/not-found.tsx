import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center"
      role="main"
      aria-labelledby="not-found-heading"
    >
      <div>
        <h1
          id="not-found-heading"
          className="text-6xl font-bold text-primary"
          aria-label="404 — Page not found"
        >
          404
        </h1>
        <p className="text-xl font-semibold mt-2">Page not found</p>
        <p className="text-muted-foreground mt-1 text-sm">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
