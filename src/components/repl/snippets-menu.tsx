"use client";

import { ShortcutsList } from "./shortcuts";
import { useState } from "react";
import { useReplStore } from "@/stores/repl-store";
import { Button } from "@/components/ui/button";
import { TouchTarget } from "@/components/ui/touch-target";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SnippetsMenu({ onThemeToggle }: { onThemeToggle?: () => void }) {
  const snippets = useReplStore((state) => state.snippets);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const replace = (code: string) => { useReplStore.getState().replaceCode(code); setOpen(false); };
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" size="sm" variant="ghost" className="relative h-8 px-2"><span className="lg:hidden">More</span><span className="hidden lg:inline">Snippets</span><TouchTarget /></Button></PopoverTrigger>
    <PopoverContent align="end" className="flex max-h-[calc(100dvh-4rem)] w-80 max-w-[calc(100vw-1rem)] flex-col gap-3 overflow-auto">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => replace("")}>New snippet</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { useReplStore.getState().saveCurrent(); setNotice("Snapshot saved on this device."); }}>Save copy</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { useReplStore.getState().resetExample(); setOpen(false); }}>Reset example</Button>
        {onThemeToggle && <Button type="button" size="sm" variant="ghost" className="lg:hidden" onClick={onThemeToggle}>Theme</Button>}
      </div>
      <p className="text-base text-muted-foreground sm:text-sm">Your draft is saved on this device. Switching snippets keeps the previous draft in recents.</p>
      {notice && <p role="status" className="text-base sm:text-sm">{notice}</p>}
      <div className="flex max-h-[45dvh] flex-col gap-1 overflow-auto border-t border-rule pt-2">
        <h2 className="px-2 py-1 text-base font-medium sm:text-sm">Recent snippets</h2>
        {snippets.length ? snippets.map(snippet => <button type="button" key={snippet.id} onClick={() => replace(snippet.code)} className="min-h-12 rounded-md px-2 py-2 text-left hover:bg-accent">
          <p className="truncate font-mono text-base sm:text-sm">{snippet.title}</p>
          <p className="text-sm text-muted-foreground">{new Date(snippet.updatedAt).toLocaleString()}</p>
        </button>) : <p className="px-2 text-base text-muted-foreground sm:text-sm">Saved and previous drafts appear here.</p>}
      </div>
      <div className="border-t border-rule pt-3 lg:hidden"><ShortcutsList /></div>
    </PopoverContent>
  </Popover>;
}
