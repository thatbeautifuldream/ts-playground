import { EditorView } from "@codemirror/view";
import {
  defaultHighlightStyle,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

// Editor chrome consumes the same semantic tokens as the surrounding app.
const editorChrome = EditorView.theme({
  "&": { backgroundColor: "var(--background)", color: "var(--foreground)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--muted)" },
  ".cm-gutters": { backgroundColor: "var(--background)", color: "var(--faint)", border: "none" },
  ".cm-activeLineGutter": { color: "var(--muted-foreground)" },
  ".cm-panels": {
    backgroundColor: "var(--background)", color: "var(--foreground)",
    fontFamily: "var(--font-inter), sans-serif", fontSize: "13px",
  },
  ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--rule)" },
  ".cm-panels.cm-panels-bottom": { borderTop: "1px solid var(--rule)" },
  ".cm-panel.cm-search": { padding: "10px 16px" },
  ".cm-textfield": {
    background: "var(--background)", color: "var(--foreground)",
    border: "1px solid var(--input)", borderRadius: "8px", padding: "4px 8px",
    fontFamily: "inherit", fontSize: "inherit",
  },
  ".cm-button": {
    background: "var(--muted)", color: "var(--foreground)",
    border: "1px solid var(--border)", borderRadius: "8px", padding: "4px 8px",
    fontFamily: "inherit", fontSize: "inherit", textTransform: "none", cursor: "pointer",
  },
  ".cm-button:hover": { background: "var(--accent)" },
  ".cm-textfield:focus-visible, .cm-button:focus-visible": { outline: "2px solid var(--ring)", outlineOffset: "2px" },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)", color: "var(--foreground)",
    border: "1px solid var(--rule)", borderRadius: "8px", overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  ".cm-tooltip-autocomplete > ul": { fontFamily: "var(--font-google-sans-code), monospace", padding: "4px", fontSize: "13px" },
  ".cm-tooltip-autocomplete > ul > li": { padding: "3px 8px", borderRadius: "6px" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": { background: "var(--accent)", color: "var(--foreground)" },
  ".cm-completionIcon": { display: "none" },
  ".cm-completionDetail": { color: "var(--muted-foreground)", marginLeft: "8px" },
  ".cm-searchMatch": { backgroundColor: "var(--accent)", outline: "1px solid var(--input)" },
  ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "var(--muted)", outline: "1px solid var(--ring)" },
  ".cm-selectionMatch": { backgroundColor: "var(--accent)" },
  ".cm-foldPlaceholder": { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)", borderRadius: "4px" },
});

const lightEditorTheme = EditorView.theme(
  {
    "&": { color: "var(--foreground)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, ::selection":
      { backgroundColor: "#b4d8ff" },
    ".cm-selectionBackground": { backgroundColor: "#d4e6f9" },
    ".cm-activeLine": { backgroundColor: "var(--muted)" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "var(--faint)",
      border: "none",
    },
    ".cm-activeLineGutter": { backgroundColor: "var(--muted)", color: "var(--foreground)" },
    ".cm-matchingBracket": {
      backgroundColor: "#b4d8ff66",
      outline: "1px solid #0550ae",
    },
  },
  { dark: false }
);

export const lightTheme: Extension = [
  editorChrome,
  lightEditorTheme,
  syntaxHighlighting(defaultHighlightStyle),
];

const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#d98ff2" },
  { tag: [t.atom, t.bool, t.url, t.contentSeparator, t.labelName], color: "#8fb8ff" },
  { tag: [t.literal, t.inserted], color: "#7ee787" },
  { tag: [t.string, t.deleted], color: "#ff9e9e" },
  { tag: [t.regexp, t.escape, t.special(t.string)], color: "#ffa657" },
  { tag: t.definition(t.variableName), color: "#79c0ff" },
  { tag: t.local(t.variableName), color: "#79c0ff" },
  { tag: [t.typeName, t.namespace], color: "#5fd7c4" },
  { tag: t.className, color: "#5fd7e0" },
  { tag: [t.special(t.variableName), t.macroName], color: "#ffab70" },
  { tag: t.definition(t.propertyName), color: "#79c0ff" },
  { tag: t.propertyName, color: "#9ecbff" },
  { tag: t.comment, color: "#9ea7b3", fontStyle: "italic" },
  { tag: t.meta, color: "#bfa3ff" },
  { tag: t.invalid, color: "#ff6b6b" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.link, textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: "#79c0ff" },
]);

const darkEditorTheme = EditorView.theme(
  {
    "&": { color: "var(--foreground)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, ::selection":
      { backgroundColor: "#28527a" },
    ".cm-selectionBackground": { backgroundColor: "#233a52" },
    ".cm-activeLine": { backgroundColor: "var(--muted)" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "var(--faint)",
      border: "none",
    },
    ".cm-activeLineGutter": { backgroundColor: "var(--muted)", color: "var(--foreground)" },
    ".cm-matchingBracket": {
      backgroundColor: "#28527a66",
      outline: "1px solid #79c0ff",
    },
  },
  { dark: true }
);

export const darkTheme: Extension = [
  editorChrome,
  darkEditorTheme,
  syntaxHighlighting(darkHighlightStyle),
];
