import ts from "typescript";
import type { TypeCompletions } from "./completions";
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
  getScriptVersion: (file) => file === name ? String(version) : "0",
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
async function ensureLibraries() {
  libraries ??= loadLibraries().catch(error => { libraries = undefined; throw error; });
  await libraries;
}

function updateSource(code: string) {
  if (source !== code) { source = code; version++; }
}

export async function diagnose(code: string): Promise<CodeDiagnostic[]> {
  await ensureLibraries();
  updateSource(code);
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


export async function complete(code: string, position: number): Promise<TypeCompletions | null> {
  await ensureLibraries();
  updateSource(code);
  const result = service.getCompletionsAtPosition(name, position, {
    includeCompletionsForModuleExports: false,
    includeCompletionsWithInsertText: true,
    includeCompletionsWithSnippetText: false,
  });
  if (!result) return null;
  const prefix = code.slice(0, position).match(/[$\w]*$/)?.[0] ?? "";
  const from = result.optionalReplacementSpan?.start ?? position - prefix.length;
  return {
    from,
    to: result.optionalReplacementSpan ? from + result.optionalReplacementSpan.length : position,
    options: result.entries.filter(entry => !entry.isSnippet).map(entry => ({
      label: entry.name,
      insertText: entry.insertText ?? entry.name,
      sortText: entry.sortText,
      replacement: entry.replacementSpan,
      type: entry.kind === ts.ScriptElementKind.memberFunctionElement ? "method" : entry.kind === ts.ScriptElementKind.functionElement ? "function" : entry.kind === ts.ScriptElementKind.memberVariableElement || entry.kind === ts.ScriptElementKind.memberGetAccessorElement ? "property" : entry.kind === ts.ScriptElementKind.keyword ? "keyword" : "variable",
    })),
  };
}

export async function completionDetails(code: string, position: number, label: string): Promise<string> {
  await ensureLibraries();
  updateSource(code);
  const details = service.getCompletionEntryDetails(name, position, label, undefined, undefined, undefined, undefined);
  if (!details) return "";
  return [ts.displayPartsToString(details.displayParts), ts.displayPartsToString(details.documentation)].filter(Boolean).join("\n\n");
}
