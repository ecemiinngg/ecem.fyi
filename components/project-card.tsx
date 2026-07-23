import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted">{project.year}</span>
          <ArrowUpRight className="h-4 w-4 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
        <h3 className="text-lg font-semibold leading-snug text-foreground">
          {project.title}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-muted">
          {project.summary}
        </p>
        <div className="flex flex-wrap gap-2">
          {project.stack.slice(0, 4).map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
          {project.stack.length > 4 && (
            <Badge>+{project.stack.length - 4}</Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
