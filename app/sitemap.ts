import type { MetadataRoute } from "next";
import { blogPosts } from "@/data/blog-posts";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ecem.fyi";

  return [
    ...["", "/blog", "/projects", "/sandbox"].map((path) => ({
      url: `${baseUrl}${path}`,
    })),
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.date,
    })),
    ...projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
    })),
  ];
}
