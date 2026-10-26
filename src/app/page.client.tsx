"use client";

import { Terminal } from "@/components/repl/terminal";
import { Editor } from "@/components/repl/editor";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { TouchTarget } from "@/components/ui/touch-target";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSandbox } from "@/hooks/use-sandbox";
import { useMediaQuery } from "@/hooks/use-media-query";
import { compressedCodeParser } from "@/lib/url-parser";
import { compressToEncodedURIComponent } from "lz-string";
import { formatTypeScript } from "@/lib/transpile-ts";
import { useReplStore } from "@/stores/repl-store";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "@tanstack/react-hotkeys";
import type { ImperativePanelHandle } from "react-resizable-panels";


type MobileView = "editor" | "console";

export function PageClient() {
  const code = useReplStore((s) => s.code);
  const setCode = useReplStore((s) => s.setCode);
  const pushLog = useReplStore((s) => s.pushLog);
  const clearLogs = useReplStore((s) => s.clearLogs);
  const { resolvedTheme, setTheme } = useTheme();

  const [urlCode, setUrlCode] = useQueryState(
    "code",
    compressedCodeParser.withOptions({ history: "replace" })
  );
  const isInitialMount = useRef(true);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [terminalOpen, setTerminalOpen] = useState(true);
  const terminalPanelRef = useRef<ImperativePanelHandle>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);

  const toggleTerminal = () => {
    const opening = isMobile ? mobileView !== "console" : !terminalOpen;
    if (isMobile) {
      setMobileView(opening ? "console" : "editor");
    } else if (opening) {
      terminalPanelRef.current?.expand();
    } else {
      terminalPanelRef.current?.collapse();
    }
    requestAnimationFrame(() => {
      if (opening) terminalRef.current?.focus();
      else workspaceRef.current?.querySelector<HTMLElement>(".cm-content")?.focus();
    });
  };

  useEffect(() => {
    if (isInitialMount.current) {
      if (urlCode) {
        setCode(urlCode);
      }
      isInitialMount.current = false;
    }
  }, [urlCode, setCode]);

  useEffect(() => {
    if (!isInitialMount.current && code && code !== urlCode) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        setUrlCode(code);
      }, 500);
    }
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [code, urlCode, setUrlCode]);

  const { containerRef, run } = useSandbox((entry) => {
    pushLog(entry);
  });

  const runCode = useCallback(() => {
    clearLogs();
    run(code);
    if (isMobile) {
      setMobileView("console");
    } else {
      terminalPanelRef.current?.expand();
    }
  }, [code, clearLogs, run, isMobile]);

  const handleFormat = useCallback(async () => {
    const result = await formatTypeScript(code);
    if (result.success && result.code !== code) {
      setCode(result.code);
    }
  }, [code, setCode]);

  useHotkeys(
    [
      { hotkey: "Alt+Enter", callback: runCode, options: { meta: { name: "Run code" } } },
      { hotkey: "Control+S", callback: handleFormat, options: { meta: { name: "Format code" } } },
      { hotkey: "Meta+S", callback: handleFormat, options: { meta: { name: "Format code" } } },
      { hotkey: "Control+`", callback: toggleTerminal, options: { meta: { name: "Toggle terminal" } } },
      { hotkey: "Meta+J", callback: toggleTerminal, options: { meta: { name: "Toggle terminal" } } },
    ],
    { ignoreInputs: false, capture: true, preventDefault: true, requireReset: true }
  );

  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    if (code) {
      url.searchParams.set("code", compressToEncodedURIComponent(code));
    } else {
      url.searchParams.delete("code");
    }
    return url.toString();
  }, [code]);

  const toggleTheme = () => setTheme(resolvedTheme === "light" ? "dark" : "light");
  const editorTheme = resolvedTheme === "light" ? "light" : "dark";

  return (
    <main ref={workspaceRef} className="isolate h-dvh bg-background text-foreground overflow-hidden flex flex-col">
      {isMobile ? (
        <>
          <Header onThemeToggle={toggleTheme} getShareUrl={getShareUrl} />
          <MobileToolbar
            mobileView={mobileView}
            setMobileView={setMobileView}
            onFormat={handleFormat}
            onRun={runCode}
          />
          <div className="flex-1 min-h-0 flex flex-col">
            <div
              className={cn(
                "flex-1 min-h-0",
                mobileView === "editor" ? "block" : "hidden"
              )}
            >
              <Editor
                value={code}
                onChange={(v) => setCode(v)}
                theme={editorTheme}
              />
            </div>
            <div
              className={cn(
                "flex-1 min-h-0",
                mobileView === "console" ? "block" : "hidden"
              )}
            >
              <Terminal ref={terminalRef} />
            </div>
          </div>
        </>
      ) : (
        <>
          <Header
            onRun={runCode}
            onThemeToggle={toggleTheme}
            getShareUrl={getShareUrl}
            onFormat={handleFormat}
            onTerminalToggle={toggleTerminal}
            terminalOpen={terminalOpen}
          />
          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel defaultSize={75} minSize={30} order={1}>
              <Editor
                value={code}
                onChange={(v) => setCode(v)}
                theme={editorTheme}
              />
            </ResizablePanel>

            <ResizableHandle className={terminalOpen ? undefined : "hidden"} />

            <ResizablePanel
              ref={terminalPanelRef}
              defaultSize={25}
              minSize={8}
              maxSize={60}
              order={2}
              collapsible
              collapsedSize={0}
              inert={!terminalOpen}
              aria-hidden={!terminalOpen}
              onCollapse={() => setTerminalOpen(false)}
              onExpand={() => setTerminalOpen(true)}
            >
              <Terminal ref={terminalRef} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </>
      )}

      <div ref={containerRef} aria-hidden="true" />
    </main>
  );
}

function MobileToolbar({
  mobileView,
  setMobileView,
  onFormat,
  onRun,
}: {
  mobileView: MobileView;
  setMobileView: (v: MobileView) => void;
  onFormat: () => void;
  onRun: () => void;
}) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
      <div className="flex min-w-0 items-center gap-2" role="group" aria-label="Workspace view">
        {(["editor", "console"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setMobileView(view)}
            aria-pressed={mobileView === view}
            aria-controls={view === "console" ? "terminal-panel" : undefined}
            title={view === "console" ? "Toggle terminal (Ctrl+` / Cmd+J)" : "Show code"}
            className={cn(
              "relative h-8 shrink-0 rounded-md px-2 text-sm font-medium",
              mobileView === view ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {view === "editor" ? "Code" : "Console"}
            <TouchTarget />
          </button>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onFormat} className="relative h-8 px-2" title="Format code">
          Format<TouchTarget />
        </Button>
        <Button type="button" size="sm" onClick={onRun} className="relative h-8 px-3" title="Run (Option/Alt+Enter)" aria-keyshortcuts="Alt+Enter">
          Run<TouchTarget />
        </Button>
      </div>
    </div>
  );
}
