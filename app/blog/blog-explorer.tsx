"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import BlogCard from "@/components/blog-card";
import FadeIn from "@/components/fade-in";
import type { BlogCategory, BlogPost } from "@/data/blog-posts";

export default function BlogExplorer({
  posts,
  categories,
}: {
  posts: BlogPost[];
  categories: BlogCategory[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BlogCategory | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category === "All" || post.category === category;
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [posts, query, category]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["All", ...categories] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                category === c
                  ? "border-2 border-foreground bg-accent text-background shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
                  : "border-2 border-border text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-sm border-2 border-border bg-background-alt py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted">
          No posts match “{query}”.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, i) => (
            <FadeIn key={post.slug} delay={Math.min(i * 0.06, 0.3)}>
              <BlogCard post={post} />
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
