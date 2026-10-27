"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HEADER_LINKS, requestCompareStep } from "@/lib/navigation";

const linkClass =
  "header-link inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-sm font-medium text-foam-muted underline-offset-4 transition-colors hover:text-foam";

export function HeaderLinks() {
  const pathname = usePathname();
  const router = useRouter();

  function openCompare() {
    if (pathname !== "/") {
      router.push("/?compare=1");
      return;
    }
    requestCompareStep();
  }

  return (
    <nav
      className="order-last flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/15 py-2 md:order-none md:w-auto md:flex-nowrap md:gap-x-5 md:border-0 md:py-0"
      aria-label="Quick links"
    >
      {HEADER_LINKS.map((link) => {
        const current =
          link.kind === "compare-step"
            ? pathname === "/"
            : link.kind === "page"
              ? pathname === link.href
              : false;
        const className = `${linkClass}${current ? " text-foam underline decoration-marker decoration-2" : ""}`;

        if (link.kind === "compare-step") {
          return (
            <button key={link.label} type="button" className={className} onClick={openCompare} aria-current={current ? "page" : undefined}>
              {link.label}
            </button>
          );
        }

        return (
          <Link key={link.label} href={link.href} className={className} aria-current={current ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
