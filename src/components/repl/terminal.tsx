"use client";

import { useRef, useEffect } from "react";
import { useReplStore, type LogEntry } from "@/stores/repl-store";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Terminal() {
  const logs = useReplStore((s) => s.logs);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs]);

  return (
    <div className="h-full w-full bg-background">
      <ScrollArea className="h-full">
        <div
          className="px-4 py-3 font-mono"
          style={{
            fontSize: "var(--editor-font-size)",
            lineHeight: "1.6",
          }}
        >
          {logs.length === 0 ? (
            <div className="text-faint">
              <span className="lg:hidden">Tap Run to execute code</span>
              <span className="hidden lg:inline">
                Ctrl/Cmd + Enter to run code
              </span>
            </div>
          ) : (
            logs.map((l, i) => <LogLine key={i} entry={l} />)
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const cls =
    entry.type === "error"
      ? "whitespace-pre-wrap break-words text-destructive"
      : "whitespace-pre-wrap break-words";
  return <div className={cls}>{entry.message}</div>;
}
