import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { blogPosts } from "@/data/blog-posts";

const mdxComponents = {
  h2: (props: React.ComponentProps<"h2">) => (
    <h2 className="mt-10 mb-4 text-xl font-semibold text-foreground" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 className="mt-8 mb-3 text-lg font-semibold text-foreground" {...props} />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p className="mb-4 leading-relaxed text-muted" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="mb-4 list-disc space-y-2 pl-6 text-muted" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="mb-4 list-decimal space-y-2 pl-6 text-muted" {...props} />
  ),
  li: (props: React.ComponentProps<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a className="text-accent underline underline-offset-4 hover:text-accent-2" {...props} />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code
      className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-accent-3"
      {...props}
    />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre
      className="mb-6 overflow-x-auto rounded-xl border border-border bg-background-alt p-4 font-mono text-sm [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-foreground"
      {...props}
    />
  ),
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
      </Link>
      <Badge className="mb-4 border-accent/30 text-accent">{post.category}</Badge>
      <h1 className="mb-4 text-3xl font-semibold leading-tight sm:text-4xl">
        {post.title}
      </h1>
      <div className="mb-12 flex items-center gap-3 text-sm text-muted">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <span>·</span>
        <span>{post.readTime} read</span>
      </div>
      <div className="text-base">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>
    </article>
  );
}
