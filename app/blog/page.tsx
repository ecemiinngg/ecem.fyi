import type { Metadata } from "next";
import BlogExplorer from "./blog-explorer";
import { blogCategories, blogPosts } from "@/data/blog-posts";

export const metadata: Metadata = {
  title: "Blog | Ecem Aç",
  description:
    "Writing on analytics, server-side tracking, tag management, and data engineering.",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">
        Writing
      </p>
      <h1 className="font-display mb-4 text-3xl sm:text-4xl">Blog</h1>
      <p className="mb-12 max-w-xl text-muted">
        Notes on analytics engineering, server-side tracking, tag management,
        and the data pipelines behind them.
      </p>
      <BlogExplorer posts={blogPosts} categories={blogCategories} />
    </div>
  );
}
