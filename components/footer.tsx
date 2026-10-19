import Link from "next/link";
import { GithubIcon, LinkedinIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="border-t-2 border-border bg-[#090b16]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 font-mono text-xs leading-relaxed text-muted sm:flex-row">
        <p>© {new Date().getFullYear()} ecem.fyi — Data & Analytics Engineer</p>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/ecemiinngg"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-accent"
            aria-label="GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </Link>
          <Link
            href="https://www.linkedin.com/in/ecembircan/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-accent"
            aria-label="LinkedIn"
          >
            <LinkedinIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
