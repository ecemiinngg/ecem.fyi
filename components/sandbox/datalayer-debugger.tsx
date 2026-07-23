"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal, X, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  subscribeToDataLayer,
  getDataLayerSnapshot,
  type DataLayerEntry,
} from "@/lib/datalayer";

interface LogEntry {
  id: string;
  time: string;
  entry: DataLayerEntry;
}

const EVENT_COLORS: Record<string, string> = {
  view_item_list: "text-accent",
  add_to_cart: "text-accent-3",
  remove_from_cart: "text-rose-400",
  begin_checkout: "text-accent-2",
  purchase: "text-amber-300",
};

export default function DataLayerDebugger() {
  const [open, setOpen] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  useEffect(() => {
    const seed = getDataLayerSnapshot().map((entry) => {
      counter.current += 1;
      return {
        id: `seed-${counter.current}`,
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        entry,
      };
    });
    if (seed.length) setLogs(seed);

    const unsubscribe = subscribeToDataLayer((entry) => {
      counter.current += 1;
      setLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${counter.current}`,
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          entry,
        },
      ]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [logs]);

  const ecommerceEventCount = logs.filter((l) => l.entry.event).length;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "pixel-press fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-md border-2 border-foreground bg-background-alt px-5 py-3 text-sm font-medium shadow-[4px_4px_0_rgba(0,0,0,0.45)]",
          open && "translate-y-32 opacity-0 pointer-events-none lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto lg:hidden"
        )}
      >
        <Terminal className="h-4 w-4 text-accent" />
        DataLayer
        {ecommerceEventCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-background">
            {ecommerceEventCount}
          </span>
        )}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-background-alt/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:w-[400px] lg:max-w-[400px] lg:flex-shrink-0 lg:translate-x-0 lg:border-l lg:shadow-none",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-accent" />
            <h2 className="font-mono text-sm font-semibold">DataLayer Visualizer</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogs([])}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-foreground"
              aria-label="Clear log"
              title="Clear log"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-foreground lg:hidden"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-border px-5 py-3 text-xs text-muted">
          Listening on <code className="rounded bg-white/10 px-1 py-0.5 text-accent-3">window.dataLayer.push()</code>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin]"
        >
          {logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted">
              <ChevronRight className="h-5 w-5" />
              <p className="text-sm">
                Interact with the product grid to trigger ecommerce events.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {logs.map((log) => {
                const eventName = log.entry.event;
                const isClear = !eventName && log.entry.ecommerce === null;
                return (
                  <li
                    key={log.id}
                    className="animate-fade-up rounded-xl border border-border bg-black/30 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "font-mono text-xs font-semibold",
                          isClear
                            ? "text-muted"
                            : EVENT_COLORS[eventName ?? ""] ?? "text-foreground"
                        )}
                      >
                        {isClear ? "ecommerce: null (clear)" : eventName}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        {log.time}
                      </span>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground/80">
{JSON.stringify(log.entry, null, 2)}
                    </pre>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
