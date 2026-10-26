"use client";

import { Button } from "@/components/ui/button";
import { TouchTarget } from "@/components/ui/touch-target";

export function EditingKeys({ onInsert }: { onInsert: (key: string) => void }) {
  return <div id="editing-keys" role="group" aria-label="Editing keys" className="flex min-h-12 shrink-0 items-center justify-center gap-2 border-t border-rule px-3 pb-[env(safe-area-inset-bottom)]">
    {[{ key: "Tab", label: "Indent" }, { key: "{}", label: "Insert braces" }, { key: "()", label: "Insert parentheses" }, { key: "[]", label: "Insert brackets" }, { key: ";", label: "Insert semicolon" }].map(({ key, label }) => <Button
      key={key} type="button" variant="ghost" size="sm" aria-label={label}
      className="relative h-8 min-w-10 px-2 font-mono"
      onPointerDown={event => event.preventDefault()}
      onClick={() => onInsert(key)}
    >{key}<TouchTarget /></Button>)}
  </div>;
}
