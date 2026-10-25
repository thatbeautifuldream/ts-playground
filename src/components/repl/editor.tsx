"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { indentWithTab } from "@codemirror/commands";
import { lightTheme, darkTheme } from "./themes";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: "light" | "dark";
}

export function Editor({ value, onChange, theme }: EditorProps) {
  const extensions = useMemo(
    () => [
      javascript({ typescript: true, jsx: true }),
      EditorView.lineWrapping,
      EditorState.tabSize.of(2),
      keymap.of([indentWithTab]),
      EditorView.theme({
        "&": { height: "100%", backgroundColor: "transparent" },
        ".cm-scroller": {
          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
          fontSize: "var(--editor-font-size, 14px)",
          lineHeight: "1.7",
          letterSpacing: "0",
        },
        ".cm-content": { padding: "16px 0" },
        ".cm-line": { padding: "0 12px" },
        ".cm-gutters": { padding: "16px 0 16px 8px" },
        "&.cm-focused": { outline: "none" },
      }),
    ],
    []
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme === "dark" ? darkTheme : lightTheme}
      height="100%"
      style={{ height: "100%" }}
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
        tabSize: 2,
        searchKeymap: true,
        completionKeymap: true,
      }}
    />
  );
}
