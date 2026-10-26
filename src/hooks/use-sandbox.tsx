"use client";

import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";
import { useCallback, useEffect, useRef } from "react";
import { useReplStore } from "@/stores/repl-store";
import { transpileTypeScript } from "@/lib/transpile-ts";

export function useSandbox() {
  const workerRef = useRef<Worker | null>(null);
  const generation = useRef(0);
  const started = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispose = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
  }, []);
  const complete = useCallback((status: "success" | "error" | "stopped") => {
    useReplStore.getState().setExecution({ status, duration: Math.round(performance.now() - started.current) });
    dispose();
  }, [dispose]);
  const stop = useCallback(() => {
    generation.current++;
    complete("stopped");
  }, [complete]);
  useEffect(() => () => { generation.current++; dispose(); }, [dispose]);

  const run = useCallback(async (code: string) => {
    const id = ++generation.current;
    dispose();
    started.current = performance.now();
    const store = useReplStore.getState();
    store.clearLogs();
    store.setExecution({ status: "running", duration: 0 });
    const result = await transpileTypeScript(code);
    if (id !== generation.current) return;
    if (!result.success) {
      result.errors.forEach((message) => store.pushLog({ type: "error", message }));
      complete("error");
      return;
    }
    const worker = new Worker(new URL("../lib/execution-worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = ({ data }) => {
      if (id !== generation.current) return;
      if (data.type === "done") complete(data.payload === "error" ? "error" : "success");
      else if (data.type === "log" || data.type === "error") {
        const message = String(data.payload);
        const match = message.match(/playground\.js:(\d+):(\d+)/);
        const position = match && result.sourceMap ? originalPositionFor(new TraceMap(result.sourceMap), { line: Number(match[1]), column: Number(match[2]) - 1 }) : null;
        store.pushLog({ type: data.type, message, source: code, line: position?.line ?? undefined, column: position?.column == null ? undefined : position.column + 1 });
      }
    };
    worker.onerror = (event) => {
      if (id !== generation.current) return;
      store.pushLog({ type: "error", message: event.message || "Execution failed." });
      complete("error");
    };
    timeout.current = setTimeout(() => {
      if (id !== generation.current) return;
      store.pushLog({ type: "error", message: "Execution stopped after 30 seconds. Check for an infinite loop or a timer that never ends." });
      complete("stopped");
    }, 30_000);
    worker.postMessage(result.code);
  }, [complete, dispose]);

  return { run, stop };
}
