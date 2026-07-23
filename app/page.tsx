import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import CoderVideoScene from "@/components/hero/coder-video-scene";
import CoffeeSplashOverlay from "@/components/hero/coffee-splash-overlay";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BlogCard from "@/components/blog-card";
import ProjectCard from "@/components/project-card";
import FadeIn from "@/components/fade-in";
import { blogPosts } from "@/data/blog-posts";
import { projects } from "@/data/projects";

export default function Home() {
  const latestPosts = blogPosts.slice(0, 3);
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 2);

  return (
    <div className="flex flex-col">
      <CoffeeSplashOverlay />
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_auto]">
          <div>
            <Badge className="mb-6 border-accent/30 text-accent">
              Data & Analytics Engineer
            </Badge>
            <h1 className="font-display max-w-xl text-4xl leading-[1.15] tracking-tight sm:text-5xl">
              Turning{" "}
              <span className="gradient-text glow-text">raw events</span> into
              reliable measurement
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
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
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
              >
                <GithubIcon className="h-4 w-4" /> GitHub
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
              >
                <LinkedinIcon className="h-4 w-4" /> LinkedIn
              </Link>
            </div>
          </div>

          <div className="justify-self-center">
            <div className="w-[320px] sm:w-[420px] lg:w-[460px]">
              <CoderVideoScene />
            </div>
            <p className="mt-1 text-center font-mono text-[11px] text-muted">
              don&apos;t wake her up ☕
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">
                  Writing
                </p>
                <h2 className="font-display text-2xl sm:text-3xl">
                  From the blog
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden items-center gap-1 text-sm text-muted transition-colors hover:text-accent sm:flex"
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
            className="mt-8 flex items-center gap-1 text-sm text-muted transition-colors hover:text-accent sm:hidden"
          >
            All posts <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="border-t border-border/60 bg-background-alt/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent-2">
                  Selected Work
                </p>
                <h2 className="font-display text-2xl sm:text-3xl">
                  Featured projects
                </h2>
              </div>
              <Link
                href="/projects"
                className="hidden items-center gap-1 text-sm text-muted transition-colors hover:text-accent sm:flex"
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

      <section className="border-t border-border/60 px-6 py-24">
        <FadeIn>
          <div className="pixel-panel mx-auto max-w-4xl rounded-md p-10 text-center sm:p-16">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-3">
              Ecommerce DataLayer Sandbox
            </p>
            <h2 className="font-display text-2xl sm:text-3xl">
              See GA4 events fire in real time
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              A working ecommerce flow wired to a live{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">
                dataLayer
              </code>{" "}
              debugger — view_item_list, add_to_cart, begin_checkout, and
              purchase, exactly as they'd hit GTM.
            </p>
            <LinkButton href="/sandbox" size="lg" className="mt-8">
              Open the Sandbox <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
