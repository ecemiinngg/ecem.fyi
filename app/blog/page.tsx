import type { Metadata } from "next";
import BlogExplorer from "./blog-explorer";
import { blogCategories, blogPosts } from "@/data/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on analytics, server-side tracking, tag management, and data engineering.",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="section-label mb-3">
        Writing
      </p>
      <h1 className="font-display mb-4 text-5xl sm:text-6xl">Blog</h1>
      <p className="mb-12 max-w-xl border-b-2 border-border pb-8 text-muted leading-relaxed">
        Notes on analytics engineering, server-side tracking, tag management,
        and the data pipelines behind them.
      </p>
      <BlogExplorer posts={blogPosts} categories={blogCategories} />
    </div>
  );
}
