import ts from "typescript";
import type { CodeDiagnostic } from "./diagnostics";

const files = new Map<string, string>();
let source = "";
let version = 0;
let libraries: Promise<void> | undefined;
const options: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  strict: true,
  skipLibCheck: true,
  jsx: ts.JsxEmit.React,
  lib: ["lib.es2020.d.ts", "lib.webworker.d.ts"],
};
const name = "playground.tsx";
const service = ts.createLanguageService({
  getCompilationSettings: () => options,
  getScriptFileNames: () => [name],
  getScriptVersion: () => String(version),
  getScriptSnapshot: (file) => {
    const content = file === name ? source : files.get(file.replace(/^.*\//, ""));
    return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
  },
  getCurrentDirectory: () => "",
  getDefaultLibFileName: () => "lib.es2020.d.ts",
  fileExists: (file) => file === name || files.has(file.replace(/^.*\//, "")),
  readFile: (file) => files.get(file.replace(/^.*\//, "")),
});
async function loadLibraries() {
  const requested = new Set<string>();
  async function load(file: string): Promise<void> {
    if (requested.has(file)) return;
    requested.add(file);
    const response = await fetch(`/typescript/${file}`);
    if (!response.ok) throw new Error("Type definitions could not be loaded. Retry when online.");
    const text = await response.text();
    files.set(file, text);
    await Promise.all([...text.matchAll(/<reference lib="([^"]+)"/g)].map(match => load(`lib.${match[1]}.d.ts`)));
  }
  await Promise.all(options.lib!.map(load));
}
export async function diagnose(code: string): Promise<CodeDiagnostic[]> {
  libraries ??= loadLibraries().catch(error => { libraries = undefined; throw error; });
  await libraries;
  source = code;
  version++;
  return [...service.getSyntacticDiagnostics(name), ...service.getSemanticDiagnostics(name)].map(diagnostic => {
    const from = diagnostic.start ?? 0;
    const position = diagnostic.file?.getLineAndCharacterOfPosition(from);
    return {
      from, to: from + (diagnostic.length ?? 0),
      line: (position?.line ?? 0) + 1, column: (position?.character ?? 0) + 1,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      severity: diagnostic.category === ts.DiagnosticCategory.Warning ? "warning" : "error",
    };
  });
}
