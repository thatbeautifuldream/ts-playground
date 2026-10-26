/// <reference lib="webworker" />

import { snapshot } from "./console-value";

// User code runs off the UI thread so Stop can terminate even an infinite loop.
const scope = self as unknown as DedicatedWorkerGlobalScope;
let failed = false;
let evaluated = false;
let finished = false;
let logCount = 0;
const timers = new Set<number>();
const nativeTimeout = scope.setTimeout.bind(scope);
const nativeInterval = scope.setInterval.bind(scope);
const nativeClearTimeout = scope.clearTimeout.bind(scope);
const nativeClearInterval = scope.clearInterval.bind(scope);
const send = (type: string, payload?: unknown) => scope.postMessage({ type, payload });
const stringify = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack || value.message;
  try { return JSON.stringify(value, (_, item) => typeof item === "bigint" ? `${item}n` : item) ?? String(value); }
  catch { return String(value); }
};
const finish = () => {
  if (evaluated && timers.size === 0 && !finished) {
    finished = true;
    send("done", failed ? "error" : "success");
  }
};
const fail = (error: unknown) => { failed = true; send("error", stringify(error)); };
for (const level of ["log", "info", "warn", "debug", "error", "table"] as const) {
  console[level] = (...args: unknown[]) => {
    if (logCount++ >= 1000) {
      if (logCount === 1001) send("log", "Output limited to 1,000 messages.");
      return;
    }
    if (level === "error") failed = true;
    const values = args.map(value => snapshot(value));
    send(level === "table" ? "log" : level, { message: values.map(value => value.preview).join(" "), values });
  };
}
scope.setTimeout = ((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
  const id = nativeTimeout(() => {
    try { if (typeof callback === "function") callback(...args); else (0, eval)(callback); }
    catch (error) { fail(error); }
    finally { timers.delete(id); finish(); }
  }, delay);
  timers.add(id);
  return id;
}) as typeof scope.setTimeout;
scope.setInterval = ((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
  const id = nativeInterval(() => {
    try { if (typeof callback === "function") callback(...args); else (0, eval)(callback); }
    catch (error) { fail(error); }
  }, delay);
  timers.add(id);
  return id;
}) as typeof scope.setInterval;
scope.clearTimeout = scope.clearInterval = (id?: number) => {
  if (id !== undefined) timers.delete(id);
  nativeClearTimeout(id); nativeClearInterval(id); finish();
};
scope.addEventListener("unhandledrejection", (event) => { event.preventDefault(); fail(event.reason); send("done", "error"); });
scope.addEventListener("error", (event) => { event.preventDefault(); fail(event.message); send("done", "error"); });
scope.onmessage = async (event: MessageEvent<string>) => {
  try { await (0, eval)(`${event.data}\n//# sourceURL=playground.js`); }
  catch (error) { fail(error); }
  finally { evaluated = true; nativeTimeout(finish, 0); }
};

send("ready");
