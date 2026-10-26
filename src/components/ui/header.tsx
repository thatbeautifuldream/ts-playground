"use client";

import { SnippetsMenu } from "@/components/repl/snippets-menu";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { TouchTarget } from "./touch-target";

interface HeaderProps {
  onRun?: () => void;
  running?: boolean;
  onThemeToggle?: () => void;
  getShareUrl?: () => string;
  onFormat?: () => void;
  onTerminalToggle?: () => void;
  terminalOpen?: boolean;
}

export function Header({ onRun, onThemeToggle, getShareUrl, onFormat, onTerminalToggle, terminalOpen, running }: HeaderProps) {
  return (
    <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 sm:px-4">
      <div className="min-w-0 truncate text-sm font-medium">
        <Link href="/" aria-label="Homepage">TS Playground</Link>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {onFormat && (
          <Button type="button" variant="ghost" size="sm" onClick={onFormat} className="relative h-8 px-2" title="Format (Ctrl/Cmd+S)">
            Format<TouchTarget />
          </Button>
        )}
        {onRun && (
          <Button type="button" variant="default" size="sm" onClick={onRun} className="relative h-8 px-3" title="Run (Option/Alt+Enter)" aria-keyshortcuts="Alt+Enter">
            {running ? "Stop" : "Run"}<TouchTarget />
          </Button>
        )}
        {onTerminalToggle && (
          <Button type="button" variant="ghost" size="sm" onClick={onTerminalToggle} className="relative h-8 px-2" title="Toggle terminal (Ctrl+` / Cmd+J)" aria-expanded={terminalOpen} aria-controls="terminal-panel" aria-keyshortcuts="Control+` Meta+j">
            Terminal<TouchTarget />
          </Button>
        )}
        {getShareUrl && <SharePopover getShareUrl={getShareUrl} />}
        <SnippetsMenu onThemeToggle={onThemeToggle} />
        {onThemeToggle && (
          <Button type="button" variant="ghost" size="sm" onClick={onThemeToggle} className="relative hidden h-8 px-2 lg:inline-flex" title="Toggle theme" aria-label="Toggle theme">
            Theme<TouchTarget />
          </Button>
        )}
      </div>
    </header>
  );
}

function SharePopover({ getShareUrl }: { getShareUrl: () => string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setUrl(getShareUrl());
      setCopied(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy link", url);
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 px-2"
          type="button"
          title="Share"
        >
          Share
          <TouchTarget />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-80 max-w-[calc(100vw-1rem)] flex-col gap-3"
      >
        <PopoverHeader>
          <PopoverTitle>Share playground</PopoverTitle>
          <PopoverDescription>
            Anyone with this link can view and run your code.
          </PopoverDescription>
        </PopoverHeader>
        <InputGroup>
          <InputGroupInput
            readOnly
            value={url}
            name="share-link"
            aria-label="Share link"
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono text-xs max-sm:text-base"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="sm"
              className="relative min-w-16"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy link"}
            >
              {copied ? "Copied" : "Copy"}
              <TouchTarget />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </PopoverContent>
    </Popover>
  );
}
