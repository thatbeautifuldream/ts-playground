"use client";

import { useRef, useEffect, useState, type Ref } from "react";
import { useReplStore, type LogEntry } from "@/stores/repl-store";
import { formatSnapshot, type ConsoleValue } from "@/lib/console-value";
import { Button } from "@/components/ui/button";
import { TouchTarget } from "@/components/ui/touch-target";

export function Terminal({ ref, onNavigate }: { ref?: Ref<HTMLDivElement>; onNavigate?: (line: number, column?: number) => void }) {
  const logs = useReplStore((s) => s.logs);
  const diagnostics = useReplStore((s) => s.diagnostics);
  const execution = useReplStore((s) => s.execution);
  const scrollRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [newOutput, setNewOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [cleared, setCleared] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimeout.current) clearTimeout(copyTimeout.current); }, []);
  useEffect(() => useReplStore.subscribe((state, previous) => {
    if (state.execution !== previous.execution && state.execution.status === "running") {
      following.current = true; setNewOutput(false); setCleared(false);
    }
    if (state.logs !== previous.logs && state.logs.length && !following.current) setNewOutput(true);
  }), []);
  useEffect(() => {
    if (following.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);
  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(logs.map(entry => entry.values ? entry.values.map(value => formatSnapshot(value)).join(" ") : entry.message).join("\n"));
      setCopied(true); setCopyError(false);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch { setCopyError(true); }
  };
  return (
    <div ref={ref} id="terminal-panel" role="region" aria-label="Console" tabIndex={-1} className="flex h-full min-w-0 flex-col bg-background outline-none">
      <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-x-3 border-b border-border px-3 text-sm text-muted-foreground">
        <div role="status" className="min-w-0 py-1 tabular-nums">
          {execution.status === "running" ? "Running…" : execution.status === "idle" ? "Ready" : `${execution.status === "success" ? "Finished" : execution.status === "error" ? "Failed" : "Stopped"} · ${execution.duration} ms`}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {newOutput && <Button type="button" size="sm" variant="ghost" className="relative h-8 px-2" onClick={() => { following.current = true; setNewOutput(false); if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }}>Latest<TouchTarget /></Button>}
          <Button type="button" size="sm" variant="ghost" className="relative h-8 px-2" disabled={!logs.length} onClick={() => { useReplStore.getState().clearLogs(); setCleared(true); }}>Clear<TouchTarget /></Button>
          <Button type="button" size="sm" variant="ghost" className="relative h-8 px-2" disabled={!logs.length} onClick={copyOutput}>{copied ? "Copied" : "Copy output"}<TouchTarget /></Button>
        </div>
      </div>
      {copyError && <p role="status" className="px-4 py-2 text-base text-destructive sm:text-sm">Could not copy. Select the output and copy it manually.</p>}
      <div ref={scrollRef} data-console-scroll onScroll={(event) => {
        const element = event.currentTarget;
        following.current = element.scrollHeight - element.scrollTop - element.clientHeight < 32;
        if (following.current) setNewOutput(false);
      }} className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[length:var(--editor-font-size)] [line-height:1.6]">
        {diagnostics.length > 0 && <div className="flex flex-col gap-2 pb-3" aria-label="TypeScript problems">
          {diagnostics.map((diagnostic, index) => <button type="button" key={index} onClick={() => onNavigate?.(diagnostic.line, diagnostic.column)} className="text-left text-destructive underline decoration-destructive/30 underline-offset-4">
            Line {diagnostic.line}:{diagnostic.column} · {diagnostic.message}
          </button>)}
        </div>}
        {logs.length === 0 ? <p className="text-muted-foreground">{cleared ? "Output cleared." : execution.status === "success" ? "Finished with no output." : execution.status === "running" ? "Waiting for output…" : execution.status === "idle" ? "Run code to see output." : "No output."}</p> : logs.map((entry, index) => <LogLine key={index} entry={entry} onNavigate={onNavigate} />)}
      </div>
    </div>
  );
}

function Value({ value }: { value: ConsoleValue }) {
  if (!value.children) return <span>{value.preview}</span>;
  return <details className="min-w-0">
    <summary className="cursor-pointer list-none underline decoration-border underline-offset-4">{value.preview} · Expand</summary>
    <div className="flex flex-col border-l border-rule pl-3">
      {value.children.map((entry, index) => <div key={index} className="flex min-w-0 flex-wrap gap-x-2"><span className="text-muted-foreground">{entry.key}:</span><Value value={entry.value} /></div>)}
      {!value.children.length && <span className="text-muted-foreground">Empty</span>}
    </div>
  </details>;
}

function LogLine({ entry, onNavigate }: { entry: LogEntry; onNavigate?: (line: number, column?: number) => void }) {
  const code = useReplStore((s) => s.code);
  return <div className={`whitespace-pre-wrap break-words py-0.5 ${entry.type === "error" ? "text-destructive" : ""}`}>
    {entry.type !== "log" && <span className="select-none font-sans text-muted-foreground">{entry.type === "warn" ? "Warning" : entry.type === "error" ? "Error" : entry.type === "info" ? "Info" : "Debug"} · </span>}
    {entry.values ? <div className="inline-flex max-w-full flex-wrap items-start gap-x-2">{entry.values.map((value, index) => <Value key={index} value={value} />)}</div> : entry.message}
    {entry.line && entry.source === code && <button type="button" className="px-2 underline underline-offset-4" onClick={() => onNavigate?.(entry.line!, entry.column)}>Line {entry.line}:{entry.column}</button>}
  </div>;
}
