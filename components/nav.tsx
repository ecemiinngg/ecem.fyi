"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/sandbox", label: "Sandbox" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-[#090b16]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3" aria-label="ecem.fyi home">
          <span aria-hidden="true" className="border-2 border-[#5b7db1] bg-[#171b32] px-1.5 py-1 font-mono text-xs font-bold text-accent shadow-[3px_3px_0_#03040b]">&gt;_</span>
          <span className="site-wordmark">ecem.fyi</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-3 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className="retro-control px-4 py-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          className="retro-control p-2 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="grid grid-cols-2 gap-3 border-t-2 border-border px-6 py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className="retro-control px-3 py-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
