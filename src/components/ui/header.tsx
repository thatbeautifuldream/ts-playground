"use client";

import {
  CheckIcon,
  CopyIcon,
  MoonIcon,
  PlayIcon,
  ShareIcon,
  SunIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import GitHubButton from "react-github-btn";
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
  onThemeToggle?: () => void;
  getShareUrl?: () => string;
  onFormat?: () => void;
}

export function Header({ onRun, onThemeToggle, getShareUrl, onFormat }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 lg:h-12 px-4 lg:px-5 bg-background border-b border-border flex-shrink-0">
      <div className="flex items-center space-x-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          TS Playground
        </span>
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden lg:flex items-center text-xs -mb-1">
          <GitHubButton
            href="https://github.com/thatbeautifuldream/playground"
            data-color-scheme="no-preference: light; light: light; dark: dark;"
            data-icon="octicon-star"
            data-show-count="true"
            aria-label="Star thatbeautifuldream/playground on GitHub"
          >
            Star
          </GitHubButton>
        </div>

        {onFormat && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFormat}
            className="relative h-9 lg:h-8 px-3 lg:px-2.5 text-sm lg:text-xs cursor-pointer"
            title="Format (Ctrl/Cmd+S)"
          >
            <WandSparklesIcon className="size-4 lg:size-3.5 lg:mr-1" />
            <span className="hidden lg:inline">Format</span>
            <TouchTarget />
          </Button>
        )}

        {onRun && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRun}
            className="relative h-9 lg:h-8 px-3 lg:px-2.5 text-sm lg:text-xs cursor-pointer"
            title="Run (Ctrl/Cmd+Enter)"
          >
            <PlayIcon className="size-4 lg:size-3.5 lg:mr-1" />
            <span className="hidden lg:inline">Run</span>
            <TouchTarget />
          </Button>
        )}

        {getShareUrl && <SharePopover getShareUrl={getShareUrl} />}

        {onThemeToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className="relative h-9 w-9 lg:h-8 lg:w-8 cursor-pointer"
            title="Toggle theme"
          >
            <SunIcon className="size-4 lg:size-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute size-4 lg:size-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
            <TouchTarget />
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
          className="relative h-9 lg:h-8 px-3 lg:px-2.5 text-sm lg:text-xs cursor-pointer"
          title="Share"
        >
          <ShareIcon className="size-4 lg:size-3.5 lg:mr-1" />
          <span className="hidden lg:inline">Share</span>
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
            Anyone with this link can view and run your code
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
              size="icon-xs"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy link"}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </PopoverContent>
    </Popover>
  );
}
