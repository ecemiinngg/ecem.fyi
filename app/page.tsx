import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BlogCard from "@/components/blog-card";
import ProjectCard from "@/components/project-card";
import FadeIn from "@/components/fade-in";
import { blogPosts } from "@/data/blog-posts";
import { projects } from "@/data/projects";
import RetroRoomHero from "@/components/RetroRoomHero";

export default function Home() {
  const latestPosts = blogPosts.slice(0, 3);
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0b0d1e] text-slate-100 flex flex-col">
      {/* İnteraktif Retro Oda Hero Alanı */}
      <RetroRoomHero />

      {/* Sitenin Geri Kalan İçerikleri (Bloglar, Projeler, Sandbox) */}
      <div className="relative z-10 flex flex-col bg-[#0b0d1e]">
        <section id="about" className="scroll-mt-24 px-6 py-20 sm:py-28 border-b border-slate-800/60">
          <div className="mx-auto max-w-6xl">
            <div>
              <Badge className="mb-6 border-accent/30 text-accent font-mono">
                Data & Analytics Engineer
              </Badge>
              <h1 className="font-display max-w-2xl text-4xl leading-[1.15] tracking-tight sm:text-6xl text-slate-100">
                Turning{" "}
                <span className="text-accent">raw events</span> into
                reliable measurement
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
                I build server-side tracking pipelines, GA4 & BigQuery data
                models, and tag management systems that hold up in production —
                and write about how they actually work.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <LinkButton href="/sandbox" size="lg">
                  Try the DataLayer Sandbox
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
                <LinkButton href="/projects" variant="outline" size="lg">
                  View Projects
                </LinkButton>
              </div>
              <div className="mt-10 flex items-center gap-5">
                <Link
                  href="https://github.com/ecemiinngg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-blue-400"
                >
                  <GithubIcon className="h-4 w-4" /> GitHub
                </Link>
                <Link
                  href="https://www.linkedin.com/in/ecembircan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-blue-400"
                >
                  <LinkedinIcon className="h-4 w-4" /> LinkedIn
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 border-b border-slate-800/60">
          <div className="mx-auto max-w-6xl">
            <FadeIn>
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <p className="section-label mb-3">
                    Writing
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl text-slate-100">
                    From the blog
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="hidden items-center gap-1 text-sm text-slate-400 transition-colors hover:text-blue-400 sm:flex"
                >
                  All posts <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post, i) => (
                <FadeIn key={post.slug} delay={i * 0.08}>
                  <BlogCard post={post} />
                </FadeIn>
              ))}
            </div>
            <Link
              href="/blog"
              className="mt-8 flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-blue-400 sm:hidden"
            >
              All posts <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="px-6 py-24 border-b border-slate-800/60 bg-[#0d1025]/50">
          <div className="mx-auto max-w-6xl">
            <FadeIn>
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <p className="section-label mb-3 text-accent-2">
                    Selected Work
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl text-slate-100">
                    Featured projects
                  </h2>
                </div>
                <Link
                  href="/projects"
                  className="hidden items-center gap-1 text-sm text-slate-400 transition-colors hover:text-blue-400 sm:flex"
                >
                  All projects <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>
            <div className="grid gap-6 sm:grid-cols-2">
              {featuredProjects.map((project, i) => (
                <FadeIn key={project.slug} delay={i * 0.08}>
                  <ProjectCard project={project} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <FadeIn>
            <div className="pixel-panel bg-[#070913] mx-auto max-w-4xl p-6 text-center sm:p-16 shadow-[8px_8px_0_#000]">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-2">
                Ecommerce DataLayer Sandbox
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-slate-100">
                See GA4 events fire in real time
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                A working ecommerce flow wired to a live{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-emerald-300">
                  dataLayer
                </code>{" "}
                debugger — view_item_list, add_to_cart, begin_checkout, and
                purchase, exactly as they&apos;d hit GTM.
              </p>
              <LinkButton href="/sandbox" size="lg" className="mt-8">
                Open the Sandbox <ArrowRight className="h-4 w-4" />
              </LinkButton>
            </div>
          </FadeIn>
        </section>
      </div>
    </div>
  );
}
