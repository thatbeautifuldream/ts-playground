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
import { useHotkeys } from "react-hotkeys-hook";
import {
  CodeIcon,
  PlayIcon,
  SquareTerminalIcon,
  WandSparklesIcon,
} from "lucide-react";

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
    }
  }, [code, clearLogs, run, isMobile]);

  useHotkeys("ctrl+enter, meta+enter", runCode, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  });

  const handleFormat = useCallback(async () => {
    const result = await formatTypeScript(code);
    if (result.success && result.code !== code) {
      setCode(result.code);
    }
  }, [code, setCode]);

  useHotkeys("ctrl+s, meta+s", handleFormat, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  });

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
    <main className="h-dvh bg-background text-foreground overflow-hidden flex flex-col">
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
              <Terminal />
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
          />
          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel defaultSize={75} minSize={30}>
              <Editor
                value={code}
                onChange={(v) => setCode(v)}
                theme={editorTheme}
              />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={25} minSize={8} maxSize={60}>
              <Terminal />
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
    <div className="flex items-center gap-1.5 h-12 px-2 border-b border-border bg-background flex-shrink-0">
      <div className="flex items-center rounded-lg bg-background p-0.5 border border-border">
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          aria-pressed={mobileView === "editor"}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-9 text-sm rounded-md transition-colors",
            mobileView === "editor"
              ? "bg-accent font-medium text-foreground"
              : "text-muted-foreground"
          )}
        >
          <CodeIcon className="size-4" />
          Code
        </button>
        <button
          type="button"
          onClick={() => setMobileView("console")}
          aria-pressed={mobileView === "console"}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-9 text-sm rounded-md transition-colors",
            mobileView === "console"
              ? "bg-accent font-medium text-foreground"
              : "text-muted-foreground"
          )}
        >
          <SquareTerminalIcon className="size-4" />
          Console
        </button>
      </div>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onFormat}
        className="relative h-9 w-9 p-0 cursor-pointer"
        title="Format code"
      >
        <WandSparklesIcon className="size-4" />
        <span className="sr-only">Format</span>
        <TouchTarget />
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={onRun}
        className="relative h-9 px-4 text-sm gap-1.5 cursor-pointer"
        title="Run code"
      >
        <PlayIcon className="size-4" />
        Run
      </Button>
    </div>
  );
}
