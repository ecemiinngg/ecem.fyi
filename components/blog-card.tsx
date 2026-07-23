import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/data/blog-posts";

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <Badge className="border-accent/30 text-accent">
            {post.category}
          </Badge>
          <ArrowUpRight className="h-4 w-4 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
        <h3 className="text-lg font-semibold leading-snug text-foreground">
          {post.title}
        </h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.readTime} read</span>
        </div>
      </Card>
    </Link>
  );
}
