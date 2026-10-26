import { insertCompletionText, pickedCompletion, type CompletionSource } from "@codemirror/autocomplete";
import { completeTypeScript, getCompletionDetails } from "./transpile-ts";

export const typescriptCompletion: CompletionSource = async (context) => {
  const word = context.matchBefore(/[$\w]*/);
  if (!context.explicit && !word?.text && context.state.sliceDoc(context.pos - 1, context.pos) !== ".") return null;
  const code = context.state.doc.toString();
  context.addEventListener("abort", () => {}, { onDocChange: true });
  const response = await completeTypeScript(code, context.pos);
  if (context.aborted || !response.completions) return null;
  const { from, to, options } = response.completions;
  return {
    from, to,
    validFor: /^[$\w]*$/,
    options: options.map(entry => ({
      label: entry.label,
      type: entry.type,
      sortText: entry.sortText,
      apply: entry.replacement ? (view, completion, start, end) => {
        // Replacement spans may include punctuation for bracket-style properties.
        const span = entry.replacement!;
        const changed = start !== from || end !== to;
        view.dispatch(insertCompletionText(view.state, entry.insertText, changed ? start : span.start, changed ? end : span.start + span.length), { annotations: pickedCompletion.of(completion) });
      } : entry.insertText,
      info: async () => {
        const details = (await getCompletionDetails(code, context.pos, entry.label)).details;
        if (!details) return null;
        const element = document.createElement("div");
        element.textContent = details;
        return element;
      },
    })),
  };
};
