"use client";

import { useState } from "react";

/** remark-gfm turns `- [ ] item` into a disabled <input type="checkbox">.
 *  This swaps in a real, tickable one so an action checklist in a post is
 *  actually usable while you work through it. State is per-checkbox and
 *  intentionally not persisted — it's a scratch aid, not saved progress. */
export default function TaskCheckbox({
  checked,
  ...rest
}: React.ComponentProps<"input">) {
  const [on, setOn] = useState(Boolean(checked));

  return (
    <input
      {...rest}
      type="checkbox"
      checked={on}
      onChange={(e) => setOn(e.target.checked)}
      disabled={false}
      className="mt-1 mr-2 h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-accent-3 align-top"
    />
  );
}
