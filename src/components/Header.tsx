import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-border">
      <nav className="max-w-2xl mx-auto px-4 md:px-12 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-bold hover:underline">
            foxtrotdesign
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/research" className="hover:underline">
              Research
            </Link>
            <Link href="/images" className="hover:underline">
              Images
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
