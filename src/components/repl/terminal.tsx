"use client";

import { useRef, useEffect, type Ref } from "react";
import { useReplStore, type LogEntry } from "@/stores/repl-store";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Terminal({ ref, onNavigate }: { ref?: Ref<HTMLDivElement>; onNavigate?: (line: number, column?: number) => void }) {
  const logs = useReplStore((s) => s.logs);
  const diagnostics = useReplStore((s) => s.diagnostics);
  const execution = useReplStore((s) => s.execution);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs]);

  return (
    <div ref={ref} id="terminal-panel" role="region" aria-label="Terminal" tabIndex={-1} className="h-full w-full bg-background outline-none">
      <div role="status" className="flex h-8 items-center border-b border-border px-4 text-sm text-muted-foreground tabular-nums">
        {execution.status === "running" ? "Running…" : execution.status === "idle" ? "Ready" : `${execution.status === "success" ? "Finished" : execution.status === "error" ? "Failed" : "Stopped"} · ${execution.duration} ms`}
      </div>
      <ScrollArea className="h-[calc(100%-2rem)]">
        <div
          className="px-4 py-3 font-mono"
          style={{
            fontSize: "var(--editor-font-size)",
            lineHeight: "1.6",
          }}
        >
          {diagnostics.length > 0 && <div className="flex flex-col gap-2 pb-3" aria-label="TypeScript problems">
            {diagnostics.map((diagnostic, index) => <button type="button" key={index} onClick={() => onNavigate?.(diagnostic.line, diagnostic.column)} className="text-left text-destructive underline decoration-destructive/30 underline-offset-4">
              Line {diagnostic.line}:{diagnostic.column} · {diagnostic.message}
            </button>)}
          </div>}
          {logs.length === 0 ? (
            <div className="text-muted-foreground">
              {execution.status === "success" ? "Finished with no output." : execution.status === "running" ? "Waiting for output…" : execution.status === "idle" ? "Run code to see output." : "No output."}
            </div>
          ) : (
            logs.map((l, i) => <LogLine key={i} entry={l} onNavigate={onNavigate} />)
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

function LogLine({ entry, onNavigate }: { entry: LogEntry; onNavigate?: (line: number, column?: number) => void }) {
  const code = useReplStore((s) => s.code);
  const cls =
    entry.type === "error"
      ? "whitespace-pre-wrap break-words text-destructive"
      : "whitespace-pre-wrap break-words";
  return <div className={cls}>{entry.message}
    {entry.line && entry.source === code && <button type="button" className="px-2 underline underline-offset-4" onClick={() => onNavigate?.(entry.line!, entry.column)}>Line {entry.line}:{entry.column}</button>}
  </div>;
}
