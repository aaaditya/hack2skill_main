import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center"
      aria-labelledby="not-found-heading"
    >
      <div>
        <p
          className="text-6xl font-bold text-primary"
          aria-hidden="true"
        >
          404
        </p>
        <h1
          id="not-found-heading"
          className="text-xl font-semibold mt-2"
        >
          Page not found
        </h1>
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
