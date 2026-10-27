"use client";

import { HEADER_LINKS, requestCompareStep } from "@/lib/navigation";

const linkClass = "inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-sm font-medium text-muted transition-colors hover:text-ink";

export function HeaderLinks() {
  return (
    <nav
      className="order-last flex w-full flex-wrap items-center gap-x-4 border-t border-line py-1 md:order-none md:w-auto md:flex-nowrap md:gap-6 md:border-0 md:py-0"
      aria-label="Quick links"
    >
      {HEADER_LINKS.map((link) =>
        link.kind === "compare-step" ? (
          <button key={link.label} type="button" className={linkClass} onClick={requestCompareStep}>
            {link.label}
          </button>
        ) : (
          <a key={link.label} href={link.href} className={linkClass}>
            {link.label}
          </a>
        ),
      )}
    </nav>
  );
}
