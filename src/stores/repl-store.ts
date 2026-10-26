"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LogEntry = { type: "log" | "error"; message: string };

type ReplState = {
  code: string;
  setCode: (code: string) => void;
  logs: LogEntry[];
  pushLog: (entry: LogEntry) => void;
  clearLogs: () => void;
};

const defaultSnippet = `// TypeScript Playground - Option/Alt + Enter to run, Cmd/Ctrl + S to format

type User = {
  name: string;
  age: number;
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}! I am \${user.age} years old.\`;
};

const user: User = { name: "Milind", age: 25 };
console.log(greet(user));

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);
`;

export const useReplStore = create<ReplState>()(
  persist(
    (set, get) => ({
      code: defaultSnippet,
      setCode: (code) => set({ code }),
      logs: [],
      pushLog: (entry) => set({ logs: [...get().logs, entry] }),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: "js-repl",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ code: s.code, logs: s.logs }),
    }
  )
);
