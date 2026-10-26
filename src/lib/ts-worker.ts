/// <reference lib="webworker" />

import ts from "typescript";
import { diagnose, complete, completionDetails } from "./type-service";
import type { TypeCompletions } from "./completions";
import type { CodeDiagnostic } from "./diagnostics";

export interface TranspileRequest {
  id: number;
  kind: "transpile" | "format" | "diagnose" | "complete" | "completionDetails";
  code: string;
  position?: number;
  label?: string;
}

export interface TranspileResponse {
  id: number;
  kind: "transpile" | "format" | "diagnose" | "complete" | "completionDetails";
  success: boolean;
  code: string;
  errors: string[];
  diagnostics?: CodeDiagnostic[];
  sourceMap?: string;
  completions?: TypeCompletions | null;
  details?: string;
}

self.onmessage = async (event: MessageEvent<TranspileRequest>) => {
  const { id, kind, code } = event.data;
  if (kind === "complete" || kind === "completionDetails") {
    try {
      const position = event.data.position ?? code.length;
      const result = kind === "complete" ? { completions: await complete(code, position) } : { details: await completionDetails(code, position, event.data.label ?? "") };
      self.postMessage({ id, kind, success: true, code, errors: [], ...result });
    } catch (error) {
      self.postMessage({ id, kind, success: false, code, errors: [String(error)] });
    }
    return;
  }
  if (kind === "diagnose") {
    try {
      const diagnostics = await diagnose(code);
      self.postMessage({ id, kind, success: true, code, errors: [], diagnostics });
    } catch (error) {
      self.postMessage({ id, kind, success: false, code, errors: [String(error)], diagnostics: [] });
    }
    return;
  }
  const response: TranspileResponse =
    kind === "transpile"
      ? { id, kind, ...transpile(code) }
      : { id, kind, ...format(code) };
  (self as unknown as Worker).postMessage(response);
};

function transpile(sourceCode: string): Omit<TranspileResponse, "id" | "kind"> {
  try {
    const result = ts.transpileModule(sourceCode, {
      compilerOptions: {
        sourceMap: true,
        inlineSources: true,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        skipLibCheck: true,
        noEmit: false,
      },
      fileName: "playground.tsx",
      reportDiagnostics: true,
    });

    const errors: string[] = [];
    if (result.diagnostics && result.diagnostics.length > 0) {
      for (const diagnostic of result.diagnostics) {
        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          "\n"
        );
        if (diagnostic.file && diagnostic.start !== undefined) {
          const { line, character } =
            diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
          errors.push(`Line ${line + 1}:${character + 1} - ${message}`);
        } else {
          errors.push(message);
        }
      }
    }

    return {
      success: errors.length === 0,
      code: result.outputText,
      sourceMap: result.sourceMapText,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      code: "",
      errors: [
        `Transpilation error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

function format(sourceCode: string): Omit<TranspileResponse, "id" | "kind"> {
  try {
    const formatting = (ts as unknown as {
      formatting: {
        getFormatContext: (opts: ts.FormatCodeSettings) => unknown;
        formatDocument: (
          sourceFile: ts.SourceFile,
          ctx: unknown,
          sourceText: string
        ) => Array<{ span: { start: number; length: number }; newText: string }>;
      };
    }).formatting;

    const sourceFile = ts.createSourceFile(
      "temp.ts",
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
    const formatContext = formatting.getFormatContext({
      indentSize: 2,
      tabSize: 2,
      convertTabsToSpaces: true,
      newLineCharacter: "\n",
      indentStyle: ts.IndentStyle.Smart,
      insertSpaceAfterConstructor: true,
      insertSpaceAfterCommaDelimiter: true,
      insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
      insertSpaceAfterKeywordsInControlFlowStatements: true,
      insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: false,
      insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
      insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
      insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
      insertSpaceAfterSemicolonInForStatements: true,
      insertSpaceBeforeAndAfterBinaryOperators: true,
      insertSpaceBeforeFunctionParenthesis: false,
      placeOpenBraceOnNewLineForControlBlocks: false,
      placeOpenBraceOnNewLineForFunctions: false,
    });
    const changes = formatting.formatDocument(
      sourceFile,
      formatContext,
      sourceCode
    );
    if (changes.length === 0) return { success: true, code: sourceCode, errors: [] };
    const out = changes.reduceRight(
      (code: string, change: { span: { start: number; length: number }; newText: string }) =>
        code.slice(0, change.span.start) +
        change.newText +
        code.slice(change.span.start + change.span.length),
      sourceCode
    );
    return { success: true, code: out, errors: [] };
  } catch (error) {
    return {
      success: false,
      code: sourceCode,
      errors: [
        `Format error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

self.postMessage({ type: "ready" });
