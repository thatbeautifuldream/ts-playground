import type { TypeCompletions } from "./completions";
import type { CodeDiagnostic } from "./diagnostics";
import type { TranspileResponse } from "./ts-worker";

export interface TranspileResult {
  success: boolean;
  code: string;
  errors: string[];
  diagnostics?: CodeDiagnostic[];
  sourceMap?: string;
  completions?: TypeCompletions | null;
  details?: string;
}

type PendingEntry = {
  resolve: (r: TranspileResult) => void;
  reject: (e: unknown) => void;
};

let workerPromise: Promise<Worker> | null = null;
let requestCounter = 0;
const pending = new Map<number, PendingEntry>();

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = import("./ts-worker-client").then(({ createWorker }) => new Promise<Worker>((resolve, rejectReady) => {
      const worker = createWorker();
      const readyTimeout = setTimeout(() => { worker.terminate(); workerPromise = null; rejectReady(new Error("Compiler could not start. Try running again.")); }, 15000);
      worker.onmessage = (event: MessageEvent<TranspileResponse | { type: "ready" }>) => {
        if ("type" in event.data) { clearTimeout(readyTimeout); resolve(worker); return; }
        const { id, success, code, errors, diagnostics, sourceMap, completions, details } = event.data;
        const entry = pending.get(id);
        if (entry) {
          pending.delete(id);
          entry.resolve({ success, code, errors, diagnostics, sourceMap, completions, details });
        }
      };
      worker.onerror = (error) => {
        clearTimeout(readyTimeout);
        rejectReady(new Error(error.message || "Compiler failed to start."));
        for (const { reject } of pending.values()) reject(error);
        pending.clear();
        worker.terminate();
        workerPromise = null;
      };
    }));
  }
  return workerPromise;
}

async function request(kind: "transpile" | "format" | "diagnose" | "complete" | "completionDetails", code: string, position?: number, label?: string) {
  try {
    const worker = await getWorker();
    const id = ++requestCounter;
    return await new Promise<TranspileResult>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, kind, code, position, label });
    });
  } catch (error) {
    return {
      success: false,
      code: "",
      errors: [
        `Worker error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

export function transpileTypeScript(sourceCode: string): Promise<TranspileResult> {
  return request("transpile", sourceCode);
}

export function formatTypeScript(sourceCode: string): Promise<TranspileResult> {
  return request("format", sourceCode);
}

export function diagnoseTypeScript(code: string) { return request("diagnose", code); }

export function completeTypeScript(code: string, position: number) { return request("complete", code, position); }
export function getCompletionDetails(code: string, position: number, label: string) { return request("completionDetails", code, position, label); }
