"use client";

import { useSyncExternalStore } from "react";
import { formatForDisplay, useHotkeyRegistrations, type DisplayHotkey } from "@tanstack/react-hotkeys";
import { Button } from "@/components/ui/button";
import { TouchTarget } from "@/components/ui/touch-target";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const subscribe = () => () => {};
export function ShortcutHint({ hotkey }: { hotkey: DisplayHotkey }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return <kbd className="font-mono font-normal text-muted-foreground">{mounted ? formatForDisplay(hotkey) : ""}</kbd>;
}

export function ShortcutsList() {
  const registrations = useHotkeyRegistrations();
  const groups = new Map<string, string[]>();
  for (const registration of registrations) {
    const name = registration.options.meta?.name;
    if (!name) continue;
    const keys = groups.get(name) ?? [];
    const label = formatForDisplay(registration.hotkey);
    if (!keys.includes(label)) keys.push(label);
    groups.set(name, keys);
  }
  return <div className="flex flex-col gap-3">
    <h2 className="text-base font-medium sm:text-sm">Keyboard shortcuts</h2>
    <dl className="flex flex-col gap-3 text-base sm:text-sm">
      {[...groups].map(([name, keys]) => <div key={name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><dt>{name}</dt><dd className="font-mono text-muted-foreground">{keys.join(" / ")}</dd></div>)}
    </dl>
    <p className="text-base text-muted-foreground sm:text-sm">Shortcuts work while editing. Cmd/Ctrl+Enter stays available for inserting a line.</p>
  </div>;
}

export function ShortcutsPopover() {
  return <Popover>
    <PopoverTrigger asChild><Button type="button" size="sm" variant="ghost" className="relative hidden h-8 px-2 lg:inline-flex">Shortcuts<TouchTarget /></Button></PopoverTrigger>
    <PopoverContent align="end" className="w-80 max-w-[calc(100vw-1rem)]"><ShortcutsList /></PopoverContent>
  </Popover>;
}
