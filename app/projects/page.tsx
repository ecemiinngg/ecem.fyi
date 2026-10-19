import type { Metadata } from "next";
import ProjectCard from "@/components/project-card";
import FadeIn from "@/components/fade-in";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Analytics engineering, server-side tracking, and data pipeline projects.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="section-label mb-3 text-accent-2">
        Selected Work
      </p>
      <h1 className="font-display mb-4 text-5xl sm:text-6xl">Projects</h1>
      <p className="mb-12 max-w-xl border-b-2 border-border pb-8 text-muted leading-relaxed">
        Case studies from analytics engineering, server-side tracking
        migrations, and the data pipelines behind them.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project, i) => (
          <FadeIn key={project.slug} delay={Math.min(i * 0.08, 0.3)}>
            <ProjectCard project={project} />
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
