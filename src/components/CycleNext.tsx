import Link from "next/link";

// LIFE ISSUES → INPUT → OUTPUT → LIFE ISSUES の循環を、各ページの末尾で次へ繋ぐ。
// about ページのカードと同じ見た目にして、部品を増やさない。
export function CycleNext({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <section className="border-t border-foreground pt-8">
      <p className="mb-4 text-xs font-bold tracking-[0.2em]">NEXT</p>
      <Link
        href={href}
        className="block border border-foreground p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal-md"
      >
        <h3 className="mb-2 font-bold">{label} →</h3>
        <p className="text-xs text-muted">{description}</p>
      </Link>
    </section>
  );
}
