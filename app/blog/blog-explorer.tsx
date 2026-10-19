"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
      <div className="mb-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["All", ...categories] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className="retro-control px-3 py-2"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-sm xl:w-64 xl:shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            aria-label="Search posts"
            className="retro-input w-full py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-accent"
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
