import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/data/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return { title: `${project.title} | Ecem Aç`, description: project.summary };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href="/projects"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
      </Link>

      <div className="mb-4 flex items-center gap-3 text-sm text-muted">
        <span className="font-mono">{project.year}</span>
        <span>·</span>
        <span>{project.role}</span>
      </div>
      <h1 className="mb-6 text-3xl font-semibold leading-tight sm:text-4xl">
        {project.title}
      </h1>
      <p className="mb-8 text-lg leading-relaxed text-muted">
        {project.summary}
      </p>

      <div className="mb-10 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <Badge key={tech} className="border-accent/30 text-accent">
            {tech}
          </Badge>
        ))}
      </div>

      <div className="pixel-panel mb-10 rounded-md p-6 sm:p-8">
        <p className="leading-relaxed text-foreground/90">
          {project.description}
        </p>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Highlights</h2>
      <ul className="space-y-3">
        {project.highlights.map((h) => (
          <li key={h} className="flex items-start gap-3 text-muted">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-3" />
            <span className="leading-relaxed">{h}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
