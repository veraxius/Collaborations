"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/components/marketing/faq-data";

/**
 * One-open-at-a-time accordion. All items closed by default; if the URL hash
 * matches an item id, that item opens on mount (deep-linkable).
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && items.some((item) => item.id === hash)) {
      setOpenId(hash);
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
    }
  }, [items]);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id} id={item.id} className="scroll-mt-28">
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`${item.id}-panel`}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-condensed text-xl font-semibold text-asphalt">
                  {item.question}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-asphalt/60 transition-transform motion-reduce:transition-none ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
            </h3>
            {open && (
              <div id={`${item.id}-panel`} role="region" className="pb-6">
                <p className="max-w-3xl text-[17px] leading-relaxed text-asphalt/80">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
