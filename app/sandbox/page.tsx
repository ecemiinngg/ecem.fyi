import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import SandboxExperience from "@/components/sandbox/sandbox-experience";
import DataLayerDebugger from "@/components/sandbox/datalayer-debugger";

export const metadata: Metadata = {
  title: "DataLayer Sandbox",
  description:
    "A live ecommerce flow wired to a real dataLayer.push() debugger — view_item_list, add_to_cart, begin_checkout, purchase.",
};

export default function SandboxPage() {
  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex-1 px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-4xl lg:mx-0 lg:max-w-none">
          <Badge className="mb-4 border-accent-3/30 text-accent-3">
            E-Commerce DataLayer Sandbox
          </Badge>
          <h1 className="font-display mb-4 text-3xl sm:text-4xl">
            Test GA4 ecommerce events live
          </h1>
          <p className="mb-10 max-w-2xl text-muted">
            A working ecommerce flow wired to{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-accent-3">
              window.dataLayer.push()
            </code>
            . Browse, add to cart, check out, and purchase — every event
            appears in the panel exactly as it would hit GTM.
          </p>
          <SandboxExperience />
        </div>
      </div>
      <DataLayerDebugger />
    </div>
  );
}
